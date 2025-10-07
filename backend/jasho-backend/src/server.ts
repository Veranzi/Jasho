import express from 'express';
import { json } from 'body-parser';
import { setRoutes } from './routes';
import { connectToDatabase } from './config';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(json());

// Connect to the database
connectToDatabase();

// Set up routes
setRoutes(app);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});