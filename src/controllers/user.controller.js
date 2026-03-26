import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError, ApIError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//Step 1: taking user details
const registerUser = asyncHandler( async (req, res) => {
    const { fullname, email, username, password } = req.body;
    console.log('Email :', email);
});

//Step 2: validation
if(
    [fullname, email, username, password].some((field) => 
        field?.trim() === "")
) {
    throw new ApiError(400, "All fields are required!");
}

//Step 3: check if user already exists or not
const existedUser = User.findOne( {
    $or : [ { username }, { email } ]
})

if(existedUser) {
    throw new ApIError(409, "User with n or email already exists");
}
console.log(existedUser);

//Step 4: check for avatar and coverImage as it is compulsory
//multer provides access to files uploaded and their paths 
//so we can check if path is there or not to confirm avatar is uploaded or not
const avatarLocalPath = req.files.avatar[0]?.path;
const coverImageLocalPath = req.files.coverImage[0]?.path;
console.log(req.files);
console.log(avatarLocalPath);

if(!avatarLocalPath) {
    throw new ApIError(400, "Avatar is compulsory!");
}

//Step 5: upload avatar & coverImage on cloudinary 
//itg will take time => use await
const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);

//Step 6 : create user object to upload on DB
//User interacts with DB => we'll use this
const user = await User.create(
    {
        fullname,
        avatar : avatar.url,  //we return response in uploadOnCludinary and we can reutrn url using .url
        coverImage: coverImage.url || "",
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
    throw new ApIError(500, "Something went wrong while registering user!");
}

//Step 8 : retueren response
// sourcery skip: remove-unreachable-code
// sourcery skip: return-outside-function
return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Successfully!")
)

export { registerUser }