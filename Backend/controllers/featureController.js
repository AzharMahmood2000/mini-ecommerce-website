const Feature = require('../models/Feature');
const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again later';

const FEATURE_DEFINITIONS = [
  {
    key: 'safe_payment',
    title: 'SAFE PAYMENT',
    message: 'Your payments are 100% secure and encrypted.',
  },
  {
    key: 'easy_exchange',
    title: 'EASY EXCHANGES',
    message: 'Easy return and replacement within 7 days.',
  },
  {
    key: 'fast_delivery',
    title: 'FAST DELIVERY',
    message: 'We deliver products within 24–48 hours.',
  },
];

const allowedKeys = FEATURE_DEFINITIONS.map((definition) => definition.key);

const normalizeFeature = (feature) => {
  if (!feature) return feature;

  const plainFeature = typeof feature.toObject === 'function' ? feature.toObject() : { ...feature };
  const fallback = FEATURE_DEFINITIONS.find((definition) => definition.key === plainFeature.key);
  const message = plainFeature.message || plainFeature.description || fallback?.message || '';

  return {
    ...plainFeature,
    message,
    description: plainFeature.description || message,
  };
};

const ensureDefaultFeatures = async () => {
  await Promise.all(
    FEATURE_DEFINITIONS.map((definition) =>
      Feature.updateOne(
        { key: definition.key },
        {
          $setOnInsert: {
            key: definition.key,
            title: definition.title,
            message: definition.message,
          },
        },
        { upsert: true }
      )
    )
  );
};

const getAllFeatures = async (req, res) => {
  try {
    await ensureDefaultFeatures();

    const features = await Feature.find({ key: { $in: allowedKeys } });
    const featureMap = new Map(features.map((feature) => [feature.key, normalizeFeature(feature)]));
    const orderedFeatures = FEATURE_DEFINITIONS.map((definition) => featureMap.get(definition.key))
      .filter(Boolean)
      .map((feature) => ({
        key: feature.key,
        title: feature.title,
        message: feature.message,
        description: feature.description || feature.message,
        createdAt: feature.createdAt,
        updatedAt: feature.updatedAt,
      }));

    return res.status(200).json({
      success: true,
      count: orderedFeatures.length,
      features: orderedFeatures,
    });
  } catch (error) {
    console.error('Get features error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

const getFeatureByKey = async (req, res) => {
  try {
    const normalizedKey = String(req.params.key || '').trim();

    if (!allowedKeys.includes(normalizedKey)) {
      return res.status(400).json({
        success: false,
        message: `Invalid feature key. Allowed keys: ${allowedKeys.join(', ')}`,
      });
    }

    await ensureDefaultFeatures();

    const feature = await Feature.findOne({ key: normalizedKey });
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found',
      });
    }

    return res.status(200).json({
      success: true,
      feature: normalizeFeature(feature),
    });
  } catch (error) {
    console.error('Get feature error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

const updateFeature = async (req, res) => {
  try {
    const normalizedKey = String(req.params.key || '').trim();

    if (!allowedKeys.includes(normalizedKey)) {
      return res.status(400).json({
        success: false,
        message: `Invalid feature key. Allowed keys: ${allowedKeys.join(', ')}`,
      });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const message = String(body.message || '').trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Feature message is required',
      });
    }

    await ensureDefaultFeatures();

    const feature = await Feature.findOneAndUpdate(
      { key: normalizedKey },
      { $set: { message } },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Feature updated successfully',
      feature: normalizeFeature(feature),
    });
  } catch (error) {
    console.error('Update feature error:', error.message);
    return res.status(500).json({
      success: false,
      message: GENERIC_SERVER_MESSAGE,
    });
  }
};

const createFeature = async (req, res) => res.status(405).json({
  success: false,
  message: 'Feature creation is disabled. Fixed homepage features can only be updated.',
});

const deleteFeature = async (req, res) => res.status(405).json({
  success: false,
  message: 'Feature deletion is disabled. Fixed homepage features can only be updated.',
});

module.exports = {
  getAllFeatures,
  getFeatureByKey,
  createFeature,
  updateFeature,
  deleteFeature,
  ensureDefaultFeatures,
};
