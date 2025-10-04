// utils/repository.js
export default class Repository {
  constructor(model) {
    if (!model) throw new Error("Model must be provided");
    this.model = model;
  }
  // ========================
  // CREATE
  // ========================
  async create(data) {
    return this.model.create(data);
  }
  async insertMany(dataArray) {
    return this.model.insertMany(dataArray);
  }
  // ========================
  // READ / FIND
  // ========================
  async findOne(query = {}, projection = {}, options = {}) {
    return this.model.findOne(query, projection, options);
  }
  async findById(id, projection = {}, options = {}) {
    return this.model.findById(id, projection, options);
  }
  async find(query = {}, projection = {}, options = {}) {
    if (!query || typeof query !== "object") {
      throw new Error(`Invalid input: expected object, received ${typeof query}`);
    }
    return this.model.find(query, projection, options);
  }
  async findAll(projection = {}, options = {}) {
    return this.model.find({}, projection, options);
  }
  async findWithPagination(
    query = {},
    projection = {},
    { page = 1, limit = 10, sort = {} } = {}
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find(query, projection).skip(skip).limit(limit).sort(sort),
      this.model.countDocuments(query),
    ]);
    return { data, total, page, pages: Math.ceil(total / limit) };
  }
  async exists(query = {}) {
    return this.model.exists(query);
  }
  async count(query = {}) {
    return this.model.countDocuments(query);
  }
  // ========================
  // UPDATE
  // ========================
  async update(query, updateData, options = { new: true }) {
    return this.model.findOneAndUpdate(query, { $set: updateData }, options);
  }
  async updateById(id, updateData, options = { new: true }) {
    return this.model.findByIdAndUpdate(id, { $set: updateData }, options);
  }
  async updateMany(query, updateData, options = {}) {
    return this.model.updateMany(query, { $set: updateData }, options);
  }
  // ========================
  // DELETE
  // ========================
  async deleteOne(query) {
    return this.model.deleteOne(query);
  }
  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }
  async deleteMany(query = {}) {
    return this.model.deleteMany(query);
  }
  // ========================
  // SOFT DELETE & RESTORE
  // (if you add a `deleted` or `isActive` field in schema)
  // ========================
  async softDeleteById(id) {
    return this.model.findByIdAndUpdate(id, { $set: { deleted: true } }, { new: true });
  }
  async restoreById(id) {
    return this.model.findByIdAndUpdate(id, { $set: { deleted: false } }, { new: true });
  }
  // ========================
  // AGGREGATION & RAW OPS
  // ========================
  async aggregate(pipeline = []) {
    return this.model.aggregate(pipeline);
  }
  async bulkWrite(operations = [], options = {}) {
    return this.model.bulkWrite(operations, options);
  }
  async distinct(field, query = {}) {
    return this.model.distinct(field, query);
  }
  async rawQuery(query) {
    return this.model.collection.find(query).toArray();
  }
  // ========================
  // PROFILE OPERATIONS
  // ========================
  async getProfile(userId) {
    return this.model.findById(userId).select("-password -resetCode -resetCodeExpires");
  }
  async updateProfile(userId, profileData) {
    return this.model
      .findByIdAndUpdate(
        userId,
        { $set: profileData },
        { new: true, runValidators: true }
      )
      .select("-password -resetCode -resetCodeExpires")
  }
  async findWithPopulate(query = {}, populateField, selectFields = "") {
    return this.model.find(query).populate(populateField, selectFields);
  }
  async findOneWithPopulate(query = {}, populateField, selectFields = "") {
    return this.model.findOne(query).populate(populateField, selectFields);
  }
  async findByIdWithPopulate(id, populateField, selectFields = "") {
    return this.model.findById(id).populate(populateField, selectFields);
  }
}

