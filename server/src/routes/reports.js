const router = require('express').Router();
const { getSummary, getByCategory, getMonthly, getDaily } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/summary', getSummary);
router.get('/by-category', getByCategory);
router.get('/monthly', getMonthly);
router.get('/daily', getDaily);

module.exports = router;
