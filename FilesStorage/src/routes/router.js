import express from "express";
import FileController from "../controllers/FileController.js";

const router = express.Router();
const fileController = new FileController();

/**
 * @swagger
 * /convert:
 *   post:
 *     summary: Converts a STEP file to GLTF.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               stepFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Conversion successful
 *       400:
 *         description: No files were uploaded.
 *       500:
 *         description: Internal server error
 */
router.post("/api/convert", fileController.convertModel);

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get all converted GLTF files or a specific file by name
 *     parameters:
 *       - in: query
 *         name: fileName
 *         schema:
 *           type: string
 *         required: false
 *         description: The name of the specific file to get
 *     responses:
 *       200:
 *         description: A list of GLTF files or a specific file's data
 *       404:
 *         description: File not found
 *       500:
 *         description: Failed to fetch file(s)
 */
router.get("/api/files", fileController.getFiles);

export default router;
