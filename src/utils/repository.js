// utils/repository.js
export default class Repository {
  constructor(model) {
    if (!model) throw new Error("Model must be provided");
    this.model = model;
  }

  // ========================
  // 🟢 CREATE
  // ========================
  async create(data) {
    return this.model.create(data);
  }

  async insertMany(dataArray) {
    return this.model.insertMany(dataArray);
  }

  // ========================
  // 🟣 READ / FIND
  // ========================

  /**
   * Find one document matching a query.
   */
  async findOne(query = {}, projection = {}, options = {}) {
    return this.model.findOne(query, projection, options);
  }
  async countAll() {
    return this.count({});
  }

  async countByField(filter) {
    return this.count(filter);
  }
  /*
    Find document by ID.
   */
  async findById(id, projection = {}, options = {}) {
    return this.model.findById(id, projection, options);
  }

  /**
   * Find multiple documents based on a filter.
   * Supports chaining of Mongoose operations like populate, sort, etc.
   * @param {Object} query - The filter criteria
   * @param {Object} projection - Fields to include/exclude
   * @param {Object} options - Additional options including populate, sort, etc.
   * @returns {Query} - Mongoose query that can be chained
   */
  find(query = {}, projection = {}, options = {}) {
    if (!query || typeof query !== "object") {
      throw new Error(
        `Invalid input: expected object, received ${typeof query}`
      );
    }
    return this.model.find(query, projection, options);
  }

  /**
   * use populate and get name and different values instead of object
   */
  async findObj(query = {}, projection = {}, options = {}, populate = null) {
    if (!query || typeof query !== "object") {
      throw new Error(
        `Invalid input: expected object, received ${typeof query}`
      );
    }

    let mongooseQuery = this.model.find(query, projection, options);

    if (populate) {
      mongooseQuery = mongooseQuery.populate(populate);
    }

    return mongooseQuery.exec(); // Execute the query
  }

  /**
   * ✅ Fixed version — now supports filters properly.
   * Find all documents, optionally filtered by query.
   */
  async findAll(query = {}, projection = {}, options = {}) {
    if (!query || typeof query !== "object") {
      throw new Error(
        `Invalid input: expected object, received ${typeof query}`
      );
    }
    return this.model.find(query, projection, options);
  }

  /**
   * Find with pagination and sorting.
   */
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

  /**
   * Check if a document exists for a given query.
   */
  async exists(query = {}) {
    return this.model.exists(query);
  }

  /**
   * Count documents matching a query.
   */
  async count(query = {}) {
    return this.model.countDocuments(query);
  }

  // ========================
  // 🟠 UPDATE
  // ========================

  async update(query, updateData, options = { new: true }) {
    return this.model.findOneAndUpdate(query, { $set: updateData }, options);
  }

  async updateById(id, updateData, options = { new: true }) {
    return this.model.findByIdAndUpdate(id, { $set: updateData }, options);
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    if (!id) throw new Error('ID is required');
    return this.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, ...options }
    );
  }

  async updateMany(query, updateData, options = {}) {
    return this.model.updateMany(query, { $set: updateData }, options);
  }

  // ========================
  // 🔴 DELETE
  // ========================

  async deleteOne(query) {
    return this.model.deleteOne(query);
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  async findByIdAndDelete(id, options = {}) {
    if (!id) throw new Error('ID is required');
    return this.model.findByIdAndDelete(id, options);
  }

  async deleteMany(query = {}) {
    return this.model.deleteMany(query);
  }

  // ========================
  // 🟡 SOFT DELETE & RESTORE
  // (Requires "deleted" or "isActive" field in schema)
  // ========================

  async softDeleteById(id) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { deleted: true } },
      { new: true }
    );
  }

  // softdelete All
  async updateMany(filter, update, options = {}) {
    return this.model.updateMany(filter, update, options);
  }

  async restoreById(id) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { deleted: false } },
      { new: true }
    );
  }

  // ========================
  // 🟤 AGGREGATION & RAW OPS
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
  // 🔵 PROFILE OPERATIONS
  // (Specialized for user profiles)
  // ========================

  async getProfile(userId) {
    return this.model
      .findById(userId)
      .select("-password -resetCode -resetCodeExpires");
  }

  async updateProfile(userId, profileData) {
    return this.model
      .findByIdAndUpdate(
        userId,
        { $set: profileData },
        { new: true, runValidators: true }
      )
      .select("-password -resetCode -resetCodeExpires");
  }

  // ========================
  // 🟢 POPULATE HELPERS
  // ========================

  /**
   * Populate fields in a document or array of documents
   * @param {Document|Document[]} docs - Mongoose document(s) to populate
   * @param {String|Object|Array} fields - Fields to populate
   * @returns {Promise<Document|Document[]>}
   */
  async populate(docs, fields) {
    return this.model.populate(docs, fields);
  }

  /**
   * Find documents and populate specified fields
   * @param {Object} query - Query to find documents
   * @param {String|Object|Array} populateFields - Fields to populate
   * @param {Object} options - Additional query options (sort, limit, etc.)
   */
  async findAndPopulate(query = {}, populateFields, options = {}) {
    let queryBuilder = this.model.find(query);

    // Handle population
    if (Array.isArray(populateFields)) {
      populateFields.forEach(field => {
        queryBuilder = queryBuilder.populate(field);
      });
    } else {
      queryBuilder = queryBuilder.populate(populateFields);
    }

    // Apply sorting
    if (options.sort) {
      queryBuilder = queryBuilder.sort(options.sort);
    }

    // Apply limit
    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    // Apply skip for pagination
    if (options.skip) {
      queryBuilder = queryBuilder.skip(options.skip);
    }

    return queryBuilder.exec();
  }

  /**
   * Find one document and populate specified fields
   * @param {Object} query - Query to find the document
   * @param {String|Object|Array} populateFields - Fields to populate
   */
  async findOneAndPopulate(query = {}, populateFields) {
    return this.model.findOne(query).populate(populateFields).exec();
  }

  /**
   * Find document by ID and populate specified fields
   * @param {String|ObjectId} id - Document ID
   * @param {String|Object|Array} populateFields - Fields to populate
   */
  async findByIdAndPopulate(id, populateFields) {
    return this.model.findById(id).populate(populateFields).exec();
  }

  // Keeping the old methods for backward compatibility
  async findWithPopulate(query = {}, populateField, selectFields = "") {
    return this.findAndPopulate(query, populateField, { sort: { updatedAt: 1 } });
  }

  async findOneWithPopulate(query = {}, populateField, selectFields = "") {
    return this.findOneAndPopulate(query, populateField);
  }

  async findByIdWithPopulate(id, populateField, selectFields = "") {
    return this.findByIdAndPopulate(id, populateField);
  }
}
