#!/bin/bash

# =============================================================================
# European Call Option DeFi Project - Comprehensive Startup Script
# =============================================================================
# This script provides a complete workflow for the European Call Option DeFi
# project, including testing, compilation, deployment, and verification.
#
# Features:
# - Environment validation (Node.js, npm, .env file)
# - Automated dependency installation
# - Contract testing, compilation, and deployment
# - Contract verification on Etherscan
# - Frontend development server management
# - Security analysis with Slither
#
# Usage:
#   ./start.sh [command]
#
# Commands:
#   test            Run test suite
#   compile         Compile smart contracts
#   deploy:factory  Deploy factory contract to Sepolia
#   deploy:option   Deploy option contract to Sepolia
#   verify          Verify contracts on Etherscan
#   slither         Run Slither security analysis
#   frontend        Start frontend development server
#   workflow        Complete workflow (test → compile → deploy → verify)
#   clean           Clean compilation files and cache
#   help            Show this help message
# =============================================================================

set -e  # Exit immediately if a command exits with a non-zero status

# =============================================================================
# Path Variable Definitions
# =============================================================================
# All paths are defined as variables to avoid hardcoding and improve maintainability
# Get the directory where this script is located (project root directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
SCRIPTS_DIR="${PROJECT_ROOT}/scripts"
CONTRACTS_DIR="${PROJECT_ROOT}/contracts"
TEST_DIR="${PROJECT_ROOT}/test"
DEPLOYMENTS_DIR="${PROJECT_ROOT}/deployments"
DEPLOYMENT_FILE="${DEPLOYMENTS_DIR}/sepolia_option.json"

# =============================================================================
# Color Output Definitions
# =============================================================================
# ANSI color codes for terminal output to improve readability
RED='\033[0;31m'      # Error messages
GREEN='\033[0;32m'    # Success messages
YELLOW='\033[1;33m'   # Warning messages
BLUE='\033[0;34m'     # Info messages and headers
NC='\033[0m'          # No Color (reset)

# =============================================================================
# Utility Functions for Output
# =============================================================================
# These functions provide consistent, colored output throughout the script

# Print a section header with blue color and separator lines
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Print success message with green checkmark
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Print error message with red X
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Print warning message with yellow warning sign
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Print info message with blue info icon
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# =============================================================================
# Environment Validation
# =============================================================================
# Check and validate all required environment dependencies before running commands
check_env() {
    print_header "Environment Validation"
    
    # Check if Node.js is installed and accessible
    # Node.js is required for running Hardhat and npm commands
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js (>=18.0.0)"
        exit 1
    fi
    NODE_VERSION=$(node -v)
    print_success "Node.js: ${NODE_VERSION}"
    
    # Check if npm is installed and accessible
    # npm is required for managing project dependencies
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    NPM_VERSION=$(npm -v)
    print_success "npm: ${NPM_VERSION}"
    
    # Check if .env file exists (required for deployment operations)
    # The .env file contains sensitive configuration like private keys and API keys
    if [ ! -f "${PROJECT_ROOT}/.env" ]; then
        print_warning ".env file does not exist"
        print_info "Creating .env file template..."
        cat > "${PROJECT_ROOT}/.env.example" << EOF
# Sepolia Network Configuration
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: Gas Report
# REPORT_GAS=true
EOF
        print_info ".env.example created. Please copy it to .env and fill in the configuration"
        # Exit if deployment-related commands are run without .env file
        if [ "$1" != "test" ] && [ "$1" != "compile" ]; then
            exit 1
        fi
    else
        print_success ".env file exists"
        # Load environment variables from .env file
        source "${PROJECT_ROOT}/.env" 2>/dev/null || true
    fi
    
    # Check if node_modules directory exists (dependencies installed)
    if [ ! -d "${PROJECT_ROOT}/node_modules" ]; then
        print_warning "Dependencies not installed. Installing now..."
        cd "${PROJECT_ROOT}"
        npm install
    else
        print_success "Dependencies installed"
    fi
    
    echo ""
}

# =============================================================================
# Test Suite Execution
# =============================================================================
# Run the Hardhat test suite to validate smart contract functionality
run_tests() {
    print_header "Running Test Suite"
    cd "${PROJECT_ROOT}"
    npm run test
    print_success "Test suite completed"
}

# =============================================================================
# Smart Contract Compilation
# =============================================================================
# Compile Solidity contracts using Hardhat compiler
compile_contracts() {
    print_header "Compiling Smart Contracts"
    cd "${PROJECT_ROOT}"
    npm run compile
    print_success "Compilation completed"
}

# =============================================================================
# Factory Contract Deployment
# =============================================================================
# Deploy the OptionFactory contract to Sepolia testnet
# The factory contract is responsible for creating and managing option instances
deploy_factory() {
    print_header "Deploying Factory Contract to Sepolia"
    
    # Validate required environment variables for Sepolia deployment
    if [ -z "$SEPOLIA_RPC_URL" ] || [ -z "$PRIVATE_KEY" ]; then
        print_error "Please configure SEPOLIA_RPC_URL and PRIVATE_KEY in .env file"
        exit 1
    fi
    
    cd "${PROJECT_ROOT}"
    npm run compile
    npx hardhat run "${SCRIPTS_DIR}/deploy_factory.js" --network sepolia
    
    print_success "Factory contract deployment completed"
}

# =============================================================================
# Option Contract Deployment
# =============================================================================
# Deploy the EuropeanCallOption contract to Sepolia testnet
# This includes deploying Mock ERC20 tokens and the option contract itself
deploy_option() {
    print_header "Deploying Option Contract to Sepolia"
    
    # Validate required environment variables for Sepolia deployment
    if [ -z "$SEPOLIA_RPC_URL" ] || [ -z "$PRIVATE_KEY" ]; then
        print_error "Please configure SEPOLIA_RPC_URL and PRIVATE_KEY in .env file"
        exit 1
    fi
    
    cd "${PROJECT_ROOT}"
    npm run compile
    npx hardhat run "${SCRIPTS_DIR}/deploy_option.js" --network sepolia
    
    print_success "Option contract deployment completed"
}

# =============================================================================
# Contract Verification
# =============================================================================
# Verify deployed contracts on Etherscan to make source code publicly viewable
# This is important for transparency and trust in DeFi protocols
verify_contracts() {
    print_header "Verifying Contracts on Etherscan"
    
    # Check if Etherscan API key is configured
    if [ -z "$ETHERSCAN_API_KEY" ]; then
        print_error "Please configure ETHERSCAN_API_KEY in .env file"
        exit 1
    fi
    
    # Check if deployment file exists (contains contract addresses and constructor args)
    if [ ! -f "${DEPLOYMENT_FILE}" ]; then
        print_error "Deployment file not found: ${DEPLOYMENT_FILE}"
        print_info "Please run deployment script first"
        exit 1
    fi
    
    cd "${PROJECT_ROOT}"
    npx hardhat run "${SCRIPTS_DIR}/verify_contract.js" --network sepolia
    
    print_success "Contract verification completed"
}

# =============================================================================
# Security Analysis
# =============================================================================
# Run Slither static analysis tool to detect potential security vulnerabilities
# Slither is a Solidity static analysis framework
run_slither() {
    print_header "Running Slither Security Analysis"
    cd "${PROJECT_ROOT}"
    
    if command -v slither &> /dev/null; then
        npm run slither || print_warning "Slither analysis completed (please check for warnings)"
    else
        print_warning "Slither not installed. Skipping security analysis"
        print_info "Installation command: pip install slither-analyzer"
    fi
}

# =============================================================================
# Frontend Development Server
# =============================================================================
# Start the Next.js frontend development server for local development
start_frontend() {
    print_header "Starting Frontend Development Server"
    
    cd "${FRONTEND_DIR}"
    
    # Check if frontend dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        npm install
    fi
    
    print_info "Frontend server will start at: http://localhost:3002"
    print_info "Press Ctrl+C to stop the server"
    echo ""
    
    PORT=3002 npm run dev
}

# =============================================================================
# Complete Workflow
# =============================================================================
# Execute the complete development workflow:
# 1. Environment validation
# 2. Run tests
# 3. Compile contracts
# 4. Deploy factory contract
# 5. Deploy option contract
# 6. Verify contracts on Etherscan
full_workflow() {
    print_header "Complete Workflow: Test → Compile → Deploy → Verify"
    
    check_env "full"
    run_tests
    compile_contracts
    deploy_factory
    deploy_option
    verify_contracts
    
    print_success "Complete workflow execution finished!"
    echo ""
    print_info "Next steps:"
    echo "  1. Run './start.sh frontend' to start the frontend"
    echo "  2. Access http://localhost:3002 in your browser"
    echo ""
}

# =============================================================================
# Clean Build Artifacts
# =============================================================================
# Remove compilation artifacts and cache to ensure fresh builds
clean_all() {
    print_header "Cleaning Compilation Files and Cache"
    cd "${PROJECT_ROOT}"
    npm run clean
    print_success "Cleanup completed"
}

# =============================================================================
# Help Documentation
# =============================================================================
# Display comprehensive help information about script usage and commands
show_help() {
    cat << EOF
European Call Option DeFi Project - Startup Script

Usage:
  ./start.sh [command]

Available Commands:
  test              Run test suite
  compile           Compile smart contracts
  deploy:factory    Deploy factory contract to Sepolia
  deploy:option     Deploy option contract to Sepolia
  verify            Verify contracts on Etherscan
  slither           Run Slither security analysis
  frontend          Start frontend development server
  workflow          Complete workflow (test → compile → deploy → verify)
  clean             Clean compilation files and cache
  help              Show this help message

Examples:
  ./start.sh test              # Run tests
  ./start.sh compile            # Compile contracts
  ./start.sh deploy:factory     # Deploy factory contract
  ./start.sh deploy:option      # Deploy option contract
  ./start.sh verify             # Verify contracts
  ./start.sh frontend           # Start frontend
  ./start.sh workflow           # Execute complete workflow

Environment Requirements:
  - Node.js >= 18.0.0
  - npm >= 8.0.0
  - Configure .env file (see .env.example)

Path Variables:
  All paths are defined as variables, no hardcoding required
  Project root directory: ${PROJECT_ROOT}
EOF
}

# =============================================================================
# Main Logic
# =============================================================================
# Parse command-line arguments and execute corresponding functions
main() {
    case "${1:-help}" in
        test)
            check_env "test"
            run_tests
            ;;
        compile)
            check_env "compile"
            compile_contracts
            ;;
        deploy:factory)
            check_env
            deploy_factory
            ;;
        deploy:option)
            check_env
            deploy_option
            ;;
        verify)
            check_env
            verify_contracts
            ;;
        slither)
            check_env
            run_slither
            ;;
        frontend)
            start_frontend
            ;;
        workflow)
            full_workflow
            ;;
        clean)
            clean_all
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all command-line arguments
main "$@"

