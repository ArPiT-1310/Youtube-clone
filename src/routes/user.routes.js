import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router()

userRouter.route("/register").post(
    //injecting middleware multer.middleware.js to take input of avatar and coverImage
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
);

userRouter.route("/login").post(loginUser);

//secured routes
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

export { userRouter }