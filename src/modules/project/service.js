import Project from "./model.js";
import Bank from "../bank/model.js";
import ApiError from "../../utils/ApiError.js";

const ProService = {
    addProject: async (data) => {
        try {
            const {
                projectName,
                projectType,
                projectDetails,
                clientName,
                projectManager,
                teamMembers,
                startDate,
                endDate,
                status,
                budget,
                advanceAmount,
                pendingAmount,
                bankName,
                accountTitle,
                accountNumber,
                ibanNumber,
            } = data;

            const bankData = await Bank.create({
                bankName,
                accountTitle,
                accountNumber,
                ibanNumber,
                budget,
                advanceAmount,
                pendingAmount,
            });

            const project = await Project.create({
                projectName,
                projectType,
                projectDetails,
                clientName,
                projectManager,
                teamMembers,
                startDate,
                endDate,
                status,
                bank: bankData._id,
            });

            return project;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    getProjects: async () => {
        try {
            const projects = await Project.find({ isDeleted: false })
                .populate("bank")
                .sort({ createdAt: -1 });
            return projects;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    getProjectById: async (id) => {
        try {
            const project = await Project.findById(id).populate("bank");
            if (!project) throw ApiError.notFound("Project not found");
            return project;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    updateProject: async (id, updateData) => {
        try {
            const project = await Project.findById(id);
            if (!project) throw ApiError.notFound("Project not found");

            // Optional: update related bank fields if provided
            if (project.bank && (
                updateData.budget ||
                updateData.advanceAmount ||
                updateData.pendingAmount ||
                updateData.bankName ||
                updateData.accountTitle ||
                updateData.accountNumber ||
                updateData.ibanNumber
            )) {
                await Bank.findByIdAndUpdate(project.bank, {
                    $set: {
                        bankName: updateData.bankName,
                        accountTitle: updateData.accountTitle,
                        accountNumber: updateData.accountNumber,
                        ibanNumber: updateData.ibanNumber,
                        budget: updateData.budget,
                        advanceAmount: updateData.advanceAmount,
                        pendingAmount: updateData.pendingAmount,
                    },
                });
            }

            const updatedProject = await Project.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            ).populate("bank");

            return updatedProject;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    deleteProjectSoft: async (id) => {
        try {
            const project = await Project.findById(id);
            if (!project) throw ApiError.notFound("Project not found");

            project.status = "Deleted";
            project.isDeleted = true;
            await project.save();

            return project;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    deleteAllProjectsSoft: async () => {
        try {
            const result = await Project.updateMany(
                { isDeleted: false },
                { $set: { isDeleted: true, status: "Deleted" } }
            );
            return result;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    getDeletedProjects: async () => {
        try {
            const deleted = await Project.find({ isDeleted: true })
                .populate("bank")
                .sort({ updatedAt: -1 });
            return deleted;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    deleteProjectPermanent: async (id) => {
        try {
            const project = await Project.findById(id);
            if (!project) throw ApiError.notFound("Project not found");

            // delete associated bank record too
            if (project.bank) await Bank.findByIdAndDelete(project.bank);

            await Project.findByIdAndDelete(id);
            return { success: true };
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    deleteAllDeletedProjectsPermanent: async () => {
        try {
            const deletedProjects = await Project.find({ isDeleted: true });
            const bankIds = deletedProjects.map((p) => p.bank).filter(Boolean);

            if (bankIds.length) {
                await Bank.deleteMany({ _id: { $in: bankIds } });
            }

            await Project.deleteMany({ isDeleted: true });
            return { success: true };
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },
};

export default ProService;
