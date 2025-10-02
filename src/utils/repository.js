export default class Repository {
  constructor(model) {
    if (!model) throw new Error("Model must be provided");
    this.model = model;
  }

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

  async create(data) {
    return this.model.create(data);
  }

  async update(query, updateData, options = { new: true }) {
    return this.model.findOneAndUpdate(query, updateData, options);
  }

  async deleteOne(query) {
    return this.model.deleteOne(query);
  }


  async count(query = {}) {
    return this.model.countDocuments(query);
  }
}
