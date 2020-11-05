import mongoose from 'mongoose';

const accountSchema = mongoose.Schema({
    name: {type: String, required: true},
    agencia: {type: Number, required: true},
    conta: {type: Number, required: true},
    balance: {
        type: Number,
        required: true,
        minValue: 0
    }
});

const accountModel = mongoose.model('account', accountSchema, 'accounts');

export {accountModel};