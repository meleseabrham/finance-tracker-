const router = require('express').Router();
const { getCurrencies, createCurrency, updateCurrency, deleteCurrency } = require('../controllers/currencyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getCurrencies);
router.post('/', createCurrency);
router.put('/:id', updateCurrency);
router.delete('/:id', deleteCurrency);

module.exports = router;

