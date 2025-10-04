import ExcelJS from "exceljs";
import { UserModel } from "../modules/user/model.js";

export const exportUsersExcel = async (req, res, next) => {
    try {
        const users = await UserModel.find().lean();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Users");

        worksheet.columns = [
            { header: "Name", key: "name", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Phone", key: "phone", width: 20 },
            { header: "role_id", key: "role_id", width: 20 },
        ];

        worksheet.addRows(users);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "users.xlsx"
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        next(err);
    }
};