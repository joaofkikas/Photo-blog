import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import methodOverride from "method-override";

const app = express();
const port = 3000;
app.use(express.static("public"));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method')); // Ensure this middleware is here

// Check if uploads directory exists, if not, create it
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // Set the folder where uploaded images will be saved
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename
    }
});

const upload = multer({ storage: storage });

// Mock data to hold blog posts
let posts = [];


// Set up view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Render home page with posts
app.get('/', (req, res) => {
    const searchQuery = req.query.search?.toLowerCase() || ''; // Retrieve the search query from the URL
    
    const filteredPosts = searchQuery
        ? posts.filter(post =>
            post.description.toLowerCase().includes(searchQuery) // Filter posts by description
          )
        : posts; // If no search query, show all posts

    res.render('index', { posts: filteredPosts, searchQuery }); // Pass searchQuery to the template for highlighting
});

// Render post page (form to upload)
app.get("/post", (req, res) => {
    res.render("post", { searchQuery: "" }); // Provide a default empty value for searchQuery
});

// Handle form submission and image upload
app.post('/upload', upload.single('image'), (req, res) => {
    const { description } = req.body;
    const image = req.file;

    if (image && description) {
        // Add the new post to the posts array
        posts.push({
            id: Date.now(), // Unique ID based on current timestamp
            imagePath: `/uploads/${image.filename}`, // Save the image path
            description: description,
            createdAt: new Date() // Store the current date and time
        });
    
    console.log('Post created with ID:', Date.now()); // Log ID when post is created
    }

    // Redirect to the home page
    res.redirect('/');
});

// Delete a post by ID
app.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    console.log('Attempting to delete post with ID:', id); // Debugging line

    // Find the post by ID to get the image path
    const postToDelete = posts.find(post => post.id == id);
    
    if (postToDelete) {
        // Delete the image file from the uploads folder
        const imagePath = path.join(__dirname, 'uploads', path.basename(postToDelete.imagePath)); // Get the full image path
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Error deleting image:', err);
                return res.status(500).send('Error deleting image');
            }

            console.log(`Deleted image: ${imagePath}`);

            // Remove the post from the posts array
            posts = posts.filter(post => post.id != id); // Remove post by ID

            // Redirect back to the home page
            res.redirect('/');
        });
    } else {
        // Post not found
        res.status(404).send('Post not found');
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});