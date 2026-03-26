import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        avatar: {
            type: String,    //cloudinary url
            required: true,
        },

        coverImage: {
            type: String
        },

        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],

        password: {
            type: String,
            required: true
        },

        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

//pre hook
userSchema.pre("save", async function (next) {
    
    //if poassowrd field is not modified => then don't encrypt the password
    if(!this.isModified("password")) return next()
    
    //else encrypt it
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

//checking password enetered is correct or not
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

//our own method to generate token
username.methods.generateAccessToken = function() {
    return jwt.sign(
        //payload
        {
            _id: this._id,
            username: this.username,
            email: this.email,
            fullname: this.fullname
        },
        //access token
        process.env.ACCESS_TOKEN_SECRET,
        //expiry of token 
        {
            expiresIn: ACCESS_TOKEN_EXPIRY
        }
    );
}

username.methods.generateRefreshToken = function() {
    return jwt.sign(
        //payload
        {
            _id: this._id,
        },
        //access token
        process.env.REFRESH_TOKEN_SECRET,
        //expiry of token 
        {
            expiresIn: REFRESH_TOKEN_EXPIRY
        }
    );
}

export const User = mongoose.model("User", userSchema);