import Client from './model.js';
import ApiError from '../../utils/ApiError.js';
import Repository from '../../utils/repository.js';

const ClientRepo = new Repository(Client);

const ClientService = {
  addClient: async (data) => {
    try {
      let { email, clientName, projectId } = data || {};

      email = typeof email === 'string' ? email.trim().toLowerCase() : undefined;
      clientName = typeof clientName === 'string' ? clientName.trim() : undefined;

      if (!email && !clientName) throw ApiError.badRequest('email or clientName required');

      // build robust search criteria only with provided fields
      const or = [];
      if (email) or.push({ email });
      if (clientName) or.push({ clientName });

      const query = { isDeleted: false };
      if (or.length) query.$or = or;

      const existing = await ClientRepo.findOne(query);

      if (existing) {
        // if projectId provided and existing already linked to same project, block
        if (projectId) {
          const existingProj = existing.projectId ? existing.projectId.toString() : null;
          if (existingProj === projectId) {
            throw ApiError.conflict('Client already added for this project');
          }
          // prevent another client (different record) from already being linked to this project
          const otherForProject = await ClientRepo.findOne({ projectId, isDeleted: false });
          if (otherForProject && otherForProject._id.toString() !== existing._id.toString()) {
            throw ApiError.conflict('Another client is already associated with this project');
          }
          // associate existing client with project if different
          existing.projectId = projectId;
          // ensure stored email/clientName are normalized
          if (email) existing.email = email;
          if (clientName) existing.clientName = clientName;
          await existing.save();
          return existing;
        }
        throw ApiError.conflict('Client already exists');
      }

      // if creating new client and projectId provided, ensure project has no client yet
      if (projectId) {
        const already = await ClientRepo.findOne({ projectId, isDeleted: false });
        if (already) {
          throw ApiError.conflict('Client already added for this project');
        }
      }

      // create new client with normalized fields
      const payload = { ...data };
      if (email) payload.email = email;
      if (clientName) payload.clientName = clientName;

      const client = await ClientRepo.create(payload);
      return client;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.badRequest(err.message || 'Failed to add client');
    }
  },

  updateClient: async (id, data) => {
    try {
      const client = await ClientRepo.findByIdAndUpdate(id, data, { new: true });
      if (!client) throw ApiError.notFound('Client not found');
      return client;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.badRequest(err.message || 'Failed to update client');
    }
  },

  getAllClients: async (page = 1, limit = 10, search = '') => {
    try {
      const skip = (Number(page) - 1) * Number(limit);
      const query = { isDeleted: false };

      if (search) {
        query.$or = [
          { clientName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
        ];
      }

      const clients = await Client.find(query)
        .populate('projectId', 'projectName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Client.countDocuments(query);

      return {
        clients,
        pagination: {
          total,
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          pageSize: Number(limit),
        },
      };
    } catch (err) {
      throw ApiError.badRequest(err.message || 'Failed to fetch clients');
    }
  },

  deleteClient: async (id) => {
    try {
      const client = await ClientRepo.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!client) throw ApiError.notFound('Client not found');
      return client;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.badRequest(err.message || 'Failed to delete client');
    }
  },

  bulkDeleteClients: async (ids) => {
    try {
      if (!ids || !Array.isArray(ids)) throw ApiError.badRequest('Invalid IDs provided');
      await ClientRepo.updateMany({ _id: { $in: ids } }, { isDeleted: true });
      return { deleted: true };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.badRequest(err.message || 'Failed to delete clients');
    }
  },
};

export default ClientService;
