const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'user', // Specify the database name
});

// Check if connected to the database
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to the MongoDB database');
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Update the server response in /api/register and /api/login routes
const bcrypt = require('bcrypt');

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && bcrypt.compareSync(password, user.password)) {
      res.json({ success: true, message: `Hello, ${user.name}! Welcome back.`, user }); // Include user data
    } else {
      res.json({ success: false, message: 'Invalid Credentials. Try Again!' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: 'Email already exists. Please use a different email.' });
    }

    // Create a new user
    const newUser = new User({ name, email, password });
    await newUser.save();

    // Include user data in the response
    res.json({ success: true, message: `Hello, ${name}! Welcome to our platform.`, user: { name, email } });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});



// Define the route for updating the task status before the route for fetching tasks
app.put('/api/tasks/:taskId/completed', async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task by ID and update the completed status
    const updatedTask = await Task.findByIdAndUpdate(taskId, { completed: true }, { new: true });

    res.json({ success: true, message: 'Task marked as completed', updatedTask });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


// Add a new route for signout
app.post('/api/signout', (req, res) => {
  // Perform signout logic, such as clearing the session on the server
  // ...

  res.json({ success: true, message: 'Signout successful' });
});


const taskSchema = new mongoose.Schema({
  title: String,
  thingstodo: String,
  dueDate: String,
  completed: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  },
});


const Task = mongoose.model('Task', taskSchema);

app.post('/api/tasks', async (req, res) => {
  try {
    const { userId, title, thingstodo, dueDate } = req.body;
    const newTask = new Task({ userId, title, thingstodo, dueDate });
    await newTask.save();

    res.json({ success: true, message: 'Task added successfully' });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const { userId } = req.query;
    const tasks = await Task.find({ userId });
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.put('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, thingstodo, dueDate, completed } = req.body;

    // Update task fields, including the completed field
    await Task.findByIdAndUpdate(taskId, { title, thingstodo, dueDate, completed });

    res.json({ success: true, message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.delete('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task by ID and delete it
    await Task.findByIdAndDelete(taskId);

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


// Add the following route to handle user profile updates
app.put('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;

    // Update user fields
    await User.findByIdAndUpdate(userId, { name, email });

    res.json({ success: true, message: 'User profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Serve the static files from the 'client/build' directory
app.use(express.static(path.join(__dirname, 'client/build')));

// Route for the root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'app.js'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
