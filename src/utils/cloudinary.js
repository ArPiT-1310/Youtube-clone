import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';    //fs - file system -> helps to read, write file

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//upload a file
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        //upload file
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("File uploaded successfully", response.url);

        return response;
    } catch (error) {
        //remove the file from local server if uploaded or not to not cause bugs
        fs.unlinkSync(localFilePath);
        return null;
    }
}