// services.js
import Project from "./model.js";
import Bank from "../bank/model.js";
import ApiError from "../../utils/ApiError.js";
import Repository from "../../utils/repository.js";

const ProRepo = new Repository(Project);
const BankRepo = new Repository(Bank);

// make  afunciton in which set the project id  liek PROJ-0001 check existing ids and set the next id
const generateProjectID = async () => {
    try {
        const count = await ProRepo.countAll();
        return `PROJ-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
        throw ApiError.internal("Error generating project ID");
    }
}


const ProService = {

    addProject: async (data) => {
        try {
            const projectID = await generateProjectID();
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

            // 1️⃣ Create related bank record
            const bankData = await BankRepo.create({
                bankName,
                accountTitle,
                accountNumber,
                ibanNumber,
                budget,
                advanceAmount,
                pendingAmount,
            });

            // 2️⃣ Create project record with reference
            const project = await ProRepo.create({
                projectName,
                projectType,
                projectID,
                projectDetails,
                clientName,
                projectManager,
                teamMembers,
                startDate,
                endDate,
                status,
                bank: bankData._id,
            });

            // 3️⃣ Populate the bank data (for frontend ease)
            const populatedProject = await ProRepo.findByIdAndPopulate(
                project._id,
                "bank"
            );

            return populatedProject;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    getProjects: async () => {
        try {
            const projects = await ProRepo.findAndPopulate(
                { status: { $in: ["Pending", "Completed"] }, isDeleted: { $ne: true } },
                "bank",
                { sort: { createdAt: -1 } }
            );

            return projects;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    getProjectById: async (id) => {
        try {
            const project = await ProRepo.findByIdAndPopulate(id, "bank");
            if (!project) throw ApiError.notFound("Project not found");
            return project;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },
    updateProject: async (id, updateData = {}) => {
        try {
            const project = await ProRepo.findById(id);
            if (!project) throw ApiError.notFound("Project not found");

            // Ensure updateData is an object
            if (typeof updateData !== 'object' || updateData === null) {
                throw ApiError.badRequest("Update data must be an object");
            }

            // Separate project fields from bank fields
            const projectFields = {};

            // Only add fields that exist in updateData
            if ('projectName' in updateData) projectFields.projectName = updateData.projectName;
            if ('projectType' in updateData) projectFields.projectType = updateData.projectType;
            if ('projectDetails' in updateData) projectFields.projectDetails = updateData.projectDetails;
            if ('clientName' in updateData) projectFields.clientName = updateData.clientName;
            if ('projectManager' in updateData) projectFields.projectManager = updateData.projectManager;
            if ('teamMembers' in updateData) projectFields.teamMembers = updateData.teamMembers;
            if ('startDate' in updateData) projectFields.startDate = updateData.startDate;
            if ('endDate' in updateData) projectFields.endDate = updateData.endDate;
            if ('status' in updateData) projectFields.status = updateData.status;

            // Update related bank fields if any bank-related field is provided
            if (project.bank) {
                const bankUpdateFields = {};

                // Only include fields that are actually provided in updateData
                if ('bankName' in updateData) bankUpdateFields.bankName = updateData.bankName;
                if ('accountTitle' in updateData) bankUpdateFields.accountTitle = updateData.accountTitle;
                if ('accountNumber' in updateData) bankUpdateFields.accountNumber = updateData.accountNumber;
                if ('ibanNumber' in updateData) bankUpdateFields.ibanNumber = updateData.ibanNumber;
                if ('budget' in updateData) bankUpdateFields.budget = updateData.budget;
                if ('advanceAmount' in updateData) bankUpdateFields.advanceAmount = updateData.advanceAmount;
                if ('pendingAmount' in updateData) bankUpdateFields.pendingAmount = updateData.pendingAmount;

                // Only update bank if there are fields to update
                if (Object.keys(bankUpdateFields).length > 0) {
                    await BankRepo.findByIdAndUpdate(project.bank, {
                        $set: bankUpdateFields
                    });
                }
            }

            const updatedProject = await ProRepo.findByIdAndUpdate(id, projectFields, {
                new: true,
            });

            return await ProRepo.populate(updatedProject, "bank");
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    deleteProjectSoft: async (id) => {
        try {
            const project = await ProRepo.findById(id);
            if (!project) throw ApiError.notFound("Project not found");

            const updated = await ProRepo.findByIdAndUpdate(
                id,
                { status: "Deleted" },
                { new: true }
            );

            return updated;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    deleteAllProjectsSoft: async () => {
        try {
            return await ProRepo.updateMany(
                { status: { $ne: "Deleted" } },
                { $set: { status: "Deleted" } }
            );
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    getDeletedProjects: async () => {
        try {
            const deletedProjects = await ProRepo.find({ status: "Deleted" })
                .populate('bank')
                .sort({ updatedAt: -1 })
                .exec();
            return deletedProjects;
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    deleteProjectPermanent: async (id) => {
        try {
            const project = await ProRepo.findById(id);
            if (!project) throw ApiError.notFound("Project not found");

            if (project.bank) await BankRepo.findByIdAndDelete(project.bank);
            await ProRepo.findByIdAndDelete(id);

            return { success: true };
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },

    deleteAllDeletedProjectsPermanent: async () => {
        try {
            const deletedProjects = await ProRepo.find({ status: "Deleted" });
            const bankIds = deletedProjects.map((p) => p.bank).filter(Boolean);

            if (bankIds.length > 0) {
                await BankRepo.deleteMany({ _id: { $in: bankIds } });
            }

            await ProRepo.deleteMany({ status: "Deleted" });
            return { success: true };
        } catch (error) {
            throw ApiError.badRequest(error.message);
        }
    },
};

export default ProService;
