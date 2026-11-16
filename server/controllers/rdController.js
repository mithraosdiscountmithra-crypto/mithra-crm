import db from '../db/index.js';

/**
 * R&D Pillar Controller (Research & Development)
 * Features:
 * 1. Customer feedback logging, NPS calculation & sentiment breakdown
 * 2. Feature experimentation & A/B testing
 * 3. Beta testing logs, bug tracking & UX feedback
 */

// 1. Customer Feedback & NPS
export const getFeedback = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const result = await db.query(
      `SELECT * FROM customer_feedback WHERE merchant_id = $1`,
      [merchantId]
    );

    const feedbacks = result.rows || [];

    // NPS Calculation: Promoters (4-5), Passives (3), Detractors (1-2)
    const promoters = feedbacks.filter(f => f.rating >= 4).length;
    const passives = feedbacks.filter(f => f.rating === 3).length;
    const detractors = feedbacks.filter(f => f.rating <= 2).length;
    const total = feedbacks.length;

    const npsScore = total > 0 
      ? Math.round(((promoters - detractors) / total) * 100)
      : 0;

    const avgRating = total > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / total).toFixed(1)
      : '5.0';

    res.json({
      success: true,
      feedbacks,
      metrics: {
        totalFeedback: total,
        avgRating,
        npsScore,
        promoters,
        passives,
        detractors,
        positiveCount: feedbacks.filter(f => f.sentiment === 'POSITIVE').length,
        neutralCount: feedbacks.filter(f => f.sentiment === 'NEUTRAL').length,
        negativeCount: feedbacks.filter(f => f.sentiment === 'NEGATIVE').length
      }
    });
  } catch (err) {
    next(err);
  }
};

export const submitFeedback = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const {
      customer_id,
      customer_name,
      customer_phone,
      rating = 5,
      sentiment,
      category = 'Quality',
      feedback_text
    } = req.body;

    if (!feedback_text || !feedback_text.trim()) {
      return res.status(400).json({ success: false, error: 'Feedback text is required' });
    }

    const starRating = parseInt(rating, 10);
    const computedSentiment = sentiment || (starRating >= 4 ? 'POSITIVE' : starRating === 3 ? 'NEUTRAL' : 'NEGATIVE');

    const result = await db.query(
      `INSERT INTO customer_feedback 
        (merchant_id, customer_id, customer_name, customer_phone, rating, sentiment, category, feedback_text)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        merchantId,
        customer_id ? parseInt(customer_id, 10) : null,
        customer_name ? customer_name.trim() : 'Guest Customer',
        customer_phone ? customer_phone.trim() : null,
        starRating,
        computedSentiment,
        category,
        feedback_text.trim()
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Customer feedback logged successfully!',
      feedback: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// 2. Feature Experimentation & A/B Testing
export const getExperiments = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const result = await db.query(
      `SELECT * FROM experiments WHERE merchant_id = $1`,
      [merchantId]
    );

    const experiments = result.rows || [];

    res.json({
      success: true,
      experiments,
      summary: {
        total: experiments.length,
        running: experiments.filter(e => e.status === 'RUNNING').length,
        concluded: experiments.filter(e => e.status === 'CONCLUDED').length
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createExperiment = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const {
      test_name,
      hypothesis,
      target_segment = 'ALL',
      variant_a,
      variant_b,
      conversion_metric
    } = req.body;

    if (!test_name || !test_name.trim()) {
      return res.status(400).json({ success: false, error: 'Test name is required' });
    }
    if (!hypothesis || !hypothesis.trim()) {
      return res.status(400).json({ success: false, error: 'Hypothesis is required' });
    }
    if (!variant_a || !variant_b) {
      return res.status(400).json({ success: false, error: 'Both Variant A and Variant B must be defined' });
    }

    const result = await db.query(
      `INSERT INTO experiments 
        (merchant_id, test_name, hypothesis, target_segment, variant_a, variant_b, conversion_metric)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        merchantId,
        test_name.trim(),
        hypothesis.trim(),
        target_segment,
        variant_a.trim(),
        variant_b.trim(),
        conversion_metric ? conversion_metric.trim() : 'Conversion Rate %'
      ]
    );

    res.status(201).json({
      success: true,
      message: `Experiment "${test_name}" launched successfully!`,
      experiment: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

export const updateExperimentStatus = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      `UPDATE experiments SET status = $1 WHERE id = $2 AND merchant_id = $3 RETURNING *`,
      [status, parseInt(id, 10), merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }

    res.json({
      success: true,
      message: `Experiment status updated to ${status}`,
      experiment: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// 3. Beta Testing Logs & Bug Tracking
export const getBetaLogs = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const result = await db.query(
      `SELECT * FROM beta_testing_logs WHERE merchant_id = $1`,
      [merchantId]
    );

    const logs = result.rows || [];

    res.json({
      success: true,
      logs,
      summary: {
        total: logs.length,
        open: logs.filter(l => l.status === 'OPEN').length,
        resolved: logs.filter(l => l.status === 'RESOLVED').length,
        bugs: logs.filter(l => l.feedback_type === 'BUG').length,
        features: logs.filter(l => l.feedback_type === 'FEATURE_REQUEST').length
      }
    });
  } catch (err) {
    next(err);
  }
};

export const submitBetaLog = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const {
      feature_name,
      tester_name,
      tester_phone,
      feedback_type = 'BUG',
      severity = 'MEDIUM',
      description
    } = req.body;

    if (!feature_name || !description) {
      return res.status(400).json({ success: false, error: 'Feature name and description are required' });
    }

    const result = await db.query(
      `INSERT INTO beta_testing_logs 
        (merchant_id, feature_name, tester_name, tester_phone, feedback_type, severity, description)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        merchantId,
        feature_name.trim(),
        tester_name ? tester_name.trim() : 'Beta Tester',
        tester_phone ? tester_phone.trim() : null,
        feedback_type,
        severity,
        description.trim()
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Beta feedback log submitted successfully!',
      log: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

export const updateBetaLogStatus = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      `UPDATE beta_testing_logs SET status = $1 WHERE id = $2 AND merchant_id = $3 RETURNING *`,
      [status, parseInt(id, 10), merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Beta log entry not found' });
    }

    res.json({
      success: true,
      message: `Beta log #${id} updated to ${status}`,
      log: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};
