**This project is about converting .step file to .gltf file and it is built using Three.js library**

**How conversion is done:**
1. Uploaded .step file is converted to .obj format
2. From .obj, using obj2gltf library it is converted to .gltf

**Steps to run the application:**
1. Clone this repository
2. Navigate to FilesStorage folder and run 'npm install' and then run 'npm start' to start the server
3. Navigate to ModelViewer folder and do the same
4. Drag and drop or choose from your PC .step file which you want to convert to .gltf (there is a small square box on the bottom left to upload a file)
5. Refresh the page to see the .gltf filename on the sidebar, click on it and see the 3D model
6. .gltf and .obj files can be found in 'uploads' folder in the FilesStorage folder
