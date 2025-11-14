export default function parseFormFields(req, res, next) {
    try {
        if (!req.body) return next();

        const tryParse = (value) => {
            if (Array.isArray(value)) return value;
            if (typeof value !== "string") return value;
            const s = value.trim();
            if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) {
                try { return JSON.parse(s); } catch { return value; }
            }
            if (s.includes(",")) return s.split(",").map(x => x.trim()).filter(Boolean);
            return value;
        };

        // Parse arrays and objects
        ["emails", "tags", "addresses", "address"].forEach((key) => {
            if (req.body[key] !== undefined) {
                req.body[key] = tryParse(req.body[key]);
            }
        });

        // Convert numeric fields from string to number
        ["amount", "balance", "salary"].forEach((key) => {
            if (req.body[key] !== undefined) {
                const num = Number(req.body[key]);
                if (!isNaN(num)) {
                    req.body[key] = num;
                }
            }
        });

        if (req.body.address !== undefined && req.body.addresses === undefined) {
            req.body.addresses = req.body.address;
            delete req.body.address;
        }

        next();
    } catch (err) {
        next(err);
    }
}