import mongoose, { Schema } from "mongoose";

const fieldSchema = new Schema(
    {
        name: {
            type: String,       // "Material" — shown to admin/customer
            required: true,
            trim: true
        },

        key: {
            type: String,        // "material" — used in attributes Map on Product
            required: true,
            trim: true,
            lowercase: true,
            match: [/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, or underscores only"]
        },

        type: {
            type: String,
            required: true,
            enum: [
                "text",
                "number",
                "decimal",
                "boolean",
                "select",
                "multiselect",
                "date",
                "textarea",
                "url",
                "color"
            ]
        },

        required: {
            type: Boolean,
            default: false
        },

        
        options: {
            type: [String],
            default: undefined
        },

        
        validation: {
            min: Number,          // for number/decimal
            max: Number,          // for number/decimal
            minLength: Number,    // for text/textarea
            maxLength: Number,    // for text/textarea
            pattern: String       // optional regex, e.g. for url/text
        },

        
        displayOrder: {
            type: Number,
            default: 0
        }
    },
    { _id: false }
);

const categorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        slug: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        // Homepage: "Featured Categories"
        isFeatured: {
            type: Boolean,
            default: false
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        fields: {
            type: [fieldSchema],
            default: []
        }
    },
    { timestamps: true }
);

// Auto-generate slug from name
categorySchema.pre("save", async function () {
    if (!this.isModified("name")) return;

    const baseSlug = this.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    let candidate = baseSlug;
    let suffix = 1;
    const Model = mongoose.model("Category");

    while (await Model.exists({ slug: candidate, _id: { $ne: this._id } })) {
        candidate = `${baseSlug}-${suffix++}`;
    }
    this.slug = candidate;
});

// Guard: select/multiselect fields must define options
categorySchema.pre("save", function () {
    for (const field of this.fields) {
        if (["select", "multiselect"].includes(field.type) && (!field.options || field.options.length === 0)) {
            throw new Error(`Field "${field.name}" of type "${field.type}" requires at least one option.`);
        }
    }

    // Guard against duplicate keys within the same category
    const keys = this.fields.map((f) => f.key);
    if (new Set(keys).size !== keys.length) {
        throw new Error("Duplicate field keys are not allowed within a category.");
    }
});

export const Category = mongoose.model("Category", categorySchema);