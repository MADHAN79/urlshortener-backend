
const mongoose = require('mongoose');

const urlSchema = mongoose.Schema(
  {
    longUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;
