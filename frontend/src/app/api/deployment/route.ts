import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET handler for deployment information API
 * 
 * This API route reads deployment information from the deployments/sepolia_option.json file
 * and returns it to the frontend. The frontend uses this information to get contract addresses
 * and other deployment details.
 * 
 * @returns {Promise<NextResponse>} JSON response with deployment data or error message
 */
export async function GET() {
  try {
    // Deployment file path (relative to project root directory)
    // Next.js runs from frontend directory, process.cwd() points to frontend directory
    // Project structure: project_root/deployments/sepolia_option.json
    //                    project_root/frontend/src/app/api/deployment/route.ts
    // So from frontend, access: ../deployments/sepolia_option.json
    const deploymentPath = path.join(
      process.cwd(),
      '../deployments/sepolia_option.json'
    );

    // Check if file exists
    if (!fs.existsSync(deploymentPath)) {
      return NextResponse.json({
        success: false,
        error: 'Deployment file not found',
        message: 'Please deploy the contracts first'
      }, { status: 404 });
    }

    // Read and parse deployment information
    const deploymentData = JSON.parse(
      fs.readFileSync(deploymentPath, 'utf-8')
    );

    // Return successful response
    return NextResponse.json({
      success: true,
      deployment: deploymentData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error reading deployment file:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to read deployment file',
      message: error.message
    }, { status: 500 });
  }
}

