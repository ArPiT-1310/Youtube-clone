import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User, generateAccessToken, generateRefreshToken, isPasswordCorrect } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


//method to generate access and refresh tokens => becoz we will be using it in various other places
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        //generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //add the refresh token in DB so we would not have to enter password and username again
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false });

        return {accessToken, refreshToken};
    } catch(error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token!");
    }
}

//Step 1: taking user details
const registerUser = asyncHandler( async (req, res) => {
    const { fullname, email, username, password } = req.body;

    //Step 2: validation
    if(
        [fullname, email, username, password].some((field) => 
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required!");
    }

    //Step 3: check if user already exists or not
    const existedUser = await User.findOne( {
        $or : [ { username }, { email } ]
    })

    if(existedUser) {
        throw new ApiError(409, "User with username or email already exists");
    }

    //Step 4: check for avatar and coverImage as it is compulsory
    //multer provides access to files uploaded and their paths 
    //so we can check if path is there or not to confirm avatar is uploaded or not
    const avatarLocalPath = req.files.avatar[0]?.path;

    //const coverImageLocalPath = req.files.coverImage[0]?.path;

    let coverImageLocalPath = "";
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    console.log(req.files);
    console.log(avatarLocalPath);

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is compulsory!");
    }

    //Step 5: upload avatar & coverImage on cloudinary 
    //it will take time => use await
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

    //Step 6 : create user object to upload on DB
    //User interacts with DB => we'll use this
    const user = await User.create(
        {
            fullname,
            avatar : avatar.url,  //we return response in uploadOnCludinary and we can reutrn url using .url
            coverImage: coverImage?.url || "",
            email,
            password,
            username : username.toLowerCase()
        }
    )

    //step 7 : check if user object is created or not
    const createdUser = await User.findById(user._id).select (
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user!");
    }

    //Step 8 : return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully!")
    )
});


//login user
const loginUser = asyncHandler(async (req, res) => {
    //Step 1 : data lo -> req.body se
    const {username, email, passowrd} = req.body;

    //check if fields are not empty
    if(!username || !email) {
        throw new ApiError(400, "Username or email is required!");
    }

    //Step 2 : check for username or email in DB -> hum dono se login krenge username and email 
    const user = User.findOne({
        $or: [{username}, {email}]
    });

    //if user not found => user doesn't exist
    if(!user) {
        throw new ApiError(404, "User with username or email doesn't exist!");
    }

    //Step 3 : check password correction => we have a method isPassowrdCorrect to check if password is correct or not
    const isPasswordValid = await user.isPasswordCorrect(passowrd);

    if(!isPasswordValid) {
        throw new ApiError(401, "Password incorrect!");
    }

    //generate tokens
    const {accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    //Step 4 : Send cookies
    const options = {
        httpOnly : true,
        secure : true
    }
    
    //Step 5 : return response
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )
});

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
});

export { 
    registerUser,
    loginUser,
    logoutUser
}