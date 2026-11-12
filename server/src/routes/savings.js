const router = require('express').Router();
const {
  getSavingsGoals, createSavingsGoal, updateSavingsGoal,
  deleteSavingsGoal, addContribution, getContributions,
} = require('../controllers/savingsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getSavingsGoals);
router.post('/', createSavingsGoal);
router.patch('/:id', updateSavingsGoal);
router.delete('/:id', deleteSavingsGoal);
router.post('/:id/contribute', addContribution);
router.get('/:id/contributions', getContributions);

module.exports = router;
