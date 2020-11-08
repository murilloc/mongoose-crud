import express from 'express'
import {accountModel} from "../models/AccountModel.js";


const router = express.Router();
//const app = express();


//CREATE
router.post('/account', async (req, res, next) => {

    try {
        const newAccount = new accountModel(req.body);
        await newAccount.save();
        res.send(newAccount);
    } catch (error) {
        next(error);
    }
});

const isValidDeposit = (deposit) => {
    if (!deposit.hasOwnProperty('conta') && !deposit.hasOwnProperty('agencia') && !deposit.hasOwnProperty('valor')) {
        return false;
    }

    if (deposit.agencia == null || deposit.conta == null || deposit.valor == null) {
        return false;
    }
    return true;
}

// Item 4 - Registrar um depósito
router.patch('/account/deposito', async (req, res, next) => {
    try {
        const deposit = req.body;
        if (!isValidDeposit(deposit)) {
            res.status(400).send('Dados do depósito invalidos');
            return;
        }

        const targetAccount = await accountModel.findOne({"agencia": deposit.agencia, "conta": deposit.conta});

        if (targetAccount === null) {
            res.status(400).send('Conta inexistente');
            return;
        }

        targetAccount.balance += parseInt(deposit.valor);
        console.log(targetAccount);
        const query = {"agencia": deposit.agencia, "conta": deposit.conta};
        await accountModel.findOneAndUpdate(query, targetAccount);

        res.send(targetAccount);

    } catch (error) {
        next(error);
    }
});


// Item 5 - Registrar um saque
router.patch('/account/saque', async (req, res, next) => {
    try {
        const withdraw = req.body;
        if (!isValidDeposit(withdraw)) {
            res.status(400).send('Dados do saque invalidos');
            return;
        }

        const targetAccount = await accountModel.findOne({"agencia": withdraw.agencia, "conta": withdraw.conta});

        if (targetAccount === null) {
            res.status(400).send('Conta inexistente');
            return;
        }

        const withdrawTotalValue = parseInt(withdraw.valor) + 1;


        if (withdrawTotalValue > parseInt(targetAccount.balance)) {
            res.status(400).send('Saldo da conta insuficiente');
            return;
        }

        targetAccount.balance -= withdrawTotalValue;
        console.log(targetAccount);
        const query = {"agencia": withdraw.agencia, "conta": withdraw.conta};
        await accountModel.findOneAndUpdate(query, targetAccount);

        res.send(targetAccount);

    } catch (error) {
        next(error);
    }
})


router.get('/account/:agencia/:conta', async (req, res, next) => {
    try {

        if (req.params.agencia == null || req.params.conta == null) {
            res.status(400).send('Dados da Conta inválidos');
            return;
        }

        const targetAccount = await accountModel.findOne({"agencia": req.params.agencia, "conta": req.params.conta});

        if (targetAccount === null) {
            res.status(400).send('Conta inexistente');
            return;
        }

        res.send(targetAccount);

    } catch (error) {
        next(error);
    }
});


router.delete('/account/:agencia/:conta', async (req, res, next) => {
    try {
        if (req.params.agencia == null || req.params.conta == null) {
            res.status(400).send('Dados da Conta inválidos');
            return;
        }

        const agencia = parseInt(req.params.agencia);
        const conta = parseInt(req.params.conta);

        await accountModel.deleteOne({agencia: agencia, conta: conta});

        const contasAgencia = await accountModel.find({agencia: agencia});

        res.send({agencia: agencia, totalContas:contasAgencia.length});

    } catch (error) {
        next(error);
    }
});


// Item 8 - Transferência entre contas
router.patch('/account/transferencia', async (req, res, next) => {
    try {

        const numContaOrigem = parseInt(req.body.contaOrigem);
        const numContaDestino = parseInt(req.body.contaDestino);
        const valorTransferencia = parseInt(req.body.valor);


        if (req.body.contaOrigem == null || req.body.contaDestino == null || req.body.valor == null) {
            res.status(400).send('Dados da transferência inválidos');
            return;
        }


        let sourceAccount = await accountModel.findOne({"conta": numContaOrigem});
        let targetAccount = await accountModel.findOne({"conta": numContaDestino});

        if (sourceAccount === null) {
            res.status(400).send('Conta de origem inexistente');
            return;
        }
        if (targetAccount === null) {
            res.status(400).send('Conta de destino inexistente');
            return;
        }


        let taxa = 0;
        if (parseInt(sourceAccount.agencia) !== parseInt(targetAccount.agencia)) {
            taxa = 8;
        }

        const totalDebito = valorTransferencia + taxa;

        if (parseInt(sourceAccount.balance) < totalDebito) {
            res.status(400).send('A conta origem não possui saldo suficiente para a trnasferência');
            return;
        }

        sourceAccount.balance -= totalDebito;
        targetAccount.balance += valorTransferencia;

        console.log('Source account: ' + sourceAccount);
        console.log('Taget account: ' + targetAccount);

        await accountModel.findOneAndUpdate({
            "conta": numContaOrigem,
            "agencia": sourceAccount.agencia
        }, sourceAccount);

        await accountModel.findOneAndUpdate({
            "conta": numContaDestino,
            "agencia": targetAccount.agencia
        }, targetAccount);

        res.send(sourceAccount);

    } catch (error) {
        next(error);
    }
});


// Item 9 - Consultar saldo médio da agência
router.get('/saldomedioagencia/:agencia', async (req, res, next) => {
    try {

        if (req.params.agencia == null || req.params.agencia === '') {
            res.status(400).send('Número da agência é requerido');
            return;
        }

        const numAgencia = req.params.agencia;
        const accounts = await accountModel.find({"agencia": numAgencia});

        if (accounts.length === 0) {
            res.status(400).send('Agência inválida');
            return;
        }

        const totalAccounts = accounts.length;
        const totalBalance = accounts.reduce((acc, curr) => {
            return acc + curr.balance;
        }, 0);

        res.send({
            totalAccounts,
            totalBalance,
            averageBalance: totalBalance / totalAccounts
        });

    } catch (error) {
        next('saldomedio: ' + error);
    }
});


// Item 10 - Consultar clientes com menor saldo
router.get('/menoresbalances/:quantidade', async (req, res, next) => {
    try {

        if (req.params.quantidade == null || req.params.quantidade === '') {
            res.status(400).send('Número de resultados é obrigatório');
            return;
        }

        const quantidade = req.params.quantidade;

        console.log('quantidade: ' + quantidade);
        const accounts = await accountModel.find({}, {_id: 0, agencia: 1, conta: 1, balance: 1});

        const orderedAccounts = accounts.sort((a, b) => {
            return a.balance - b.balance;
        });

        res.send(orderedAccounts.slice(0, quantidade));

    } catch (error) {
        next('saldomedio: ' + error);
    }
});


// Item 11 - Consultar clientes com menor saldo
router.get('/maioresbalances/:quantidade', async (req, res, next) => {
    try {

        if (req.params.quantidade == null || req.params.quantidade === '') {
            res.status(400).send('Número de resultados é obrigatório');
            return;
        }

        const quantidade = req.params.quantidade;

        console.log('quantidade: ' + quantidade);
        const accounts = await accountModel.find({}, {_id: 0, agencia: 1, conta: 1, balance: 1, name: 1});

        const orderedAccounts = accounts.sort((a, b) => {
            if (a.balance === b.balance) {
                return a.name.localeCompare(b.name);
            } else {
                return b.balance - a.balance;
            }
        });

        res.send(orderedAccounts.slice(0, quantidade));

    } catch (error) {
        next(error);
    }
});


// Item 12 - transferir para agencia Private
router.patch('/agenciaprivate', async (req, res, next) => {
    try {

        const agenciasSet = new Set();
        const accounts = await accountModel.find({});
        const topClients = [];


        accounts.forEach(account => {
            agenciasSet.add(account.agencia);
        })
        const agencias = [...agenciasSet];

        agencias.forEach(agencia => {

            const clientesAgencia = accounts.filter(account => {
                return account.agencia === agencia;
            })

            const agenciaTopClient = clientesAgencia.reduce((a, b) => {
                return a.balance > b.balance ? a : b;
            })

            topClients.push(agenciaTopClient);
            updateAccount(agenciaTopClient);
        })


        res.send(topClients);

    } catch (error) {
        next(error);
    }
});

async function updateAccount(account) {
    try {
        account.agencia = 99;
        await accountModel.findByIdAndUpdate({_id: account.id}, account);
    } catch (error) {
        next(error);
    }
}


//RETRIEVE
router.get('/account', async (req, res, next) => {
    try {
        const account = await accountModel.find({});
        res.send(account);

    } catch (error) {
        next(error);
    }
});


//Search
router.get('/account/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const account = await accountModel.findById({_id: id});
        if (account) {
            res.send(account);
            return;
        }

        res.status(404).send(`Não foi possível localizar a conta com id ${id}`);

    } catch (error) {
        next(error);
    }
});


//UPDATE
router.patch('/account/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const updatedAccount = await accountModel.findByIdAndUpdate({_id: id}, req.body, {new: true});
        if (!updatedAccount) {
            res.status(404).send('Não foi possível localizar a conta com id' + id);
            return;
        }
        res.send(updatedAccount);


    } catch (error) {
        next(error);
    }
})

router.patch('/account/deposit', async (req, res, next) => {
    try {
        const deposit = req.body;
        if (!deposit.agencia || deposit.conta == null || deposit.valor == null) {

        }

    } catch (error) {
        next(error);
    }
})


//DELETE u
router.delete('/account/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const accountToDelete = await accountModel.findByIdAndDelete({_id: id});

        if (!accountToDelete) {
            res.status(404).send('Conta com  id inexistente:' + id);
        } else {
            res.status(204).send();
        }
    } catch (error) {
        next(error);
    }
})


router.use((error, req, res, next) => {
    res.status(400).send({error: error.message});
});

export default router;