import express from 'express'
import {accountModel} from "../models/AccountModel.js";

const router = express.Router();
//const app = express();


//CREATE
router.post('/', async (req, res, next) => {

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
router.patch('/deposito', async (req, res, next) => {
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
router.patch('/saque', async (req, res, next) => {
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


        if (parseInt(withdraw.valor) > parseInt(targetAccount.balance)) {
            res.status(400).send('Saldo da conta insuficiente');
            return;
        }

        targetAccount.balance -= parseInt(withdraw.valor);
        console.log(targetAccount);
        const query = {"agencia": withdraw.agencia, "conta": withdraw.conta};
        await accountModel.findOneAndUpdate(query, targetAccount);

        res.send(targetAccount);

    } catch (error) {
        next(error);
    }
})

// Item 7 - Consultar uma conta
router.get('/:agencia/:conta', async (req, res, next) => {
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
})

// Item 8 - Transferência entre contas
router.patch('/transferencia', async (req, res, next) => {
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


//RETRIEVE
router.get('/', async (req, res, next) => {
    try {
        const account = await accountModel.find({});
        res.send(account);

    } catch (error) {
        next(error);
    }
});


//Search
router.get('/:id', async (req, res, next) => {
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
router.patch('/:id', async (req, res, next) => {
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

router.patch('/deposit', async (req, res, next) => {
    try {
        const deposit = req.body;
        if (!deposit.agencia || deposit.conta == null || deposit.valor == null) {

        }

    } catch (error) {
        next(error);
    }
})


//DELETE u
router.delete('/:id', async (req, res, next) => {
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