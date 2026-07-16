import express from 'express';
import cookieParser from 'cookie-parser';
import cors from "cors" ;

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use( (express.json( {limit:"16kb"} )))
app.use(express.urlencoded({extended:true , limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())  // use cookie in ueer controller   or anywhere


// routes 
// routes imports
import adminRoutes from "./routes/admin.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import productRoutes from "./routes/product.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import searchRoutes from "./routes/search.routes.js";

// routes declaration
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/offers", offerRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/sales", saleRoutes);
app.use("/api/v1/search", searchRoutes);


app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || []
  });
});



export {app}