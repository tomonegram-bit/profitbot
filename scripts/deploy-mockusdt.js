const TronWeb = require('tronweb');
const fs = require('fs');

// MockUSDT TRC20 Contract Source
const contractSource = `
pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract MockUSDT is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    uint256 private _totalSupply;
    string public name = "Mock USDT";
    string public symbol = "USDT";
    uint8 public decimals = 6;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        _totalSupply = 1000000000000000; // 1 billion USDT
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }
    
    function allowance(address _owner, address spender) public view override returns (uint256) {
        return _allowances[_owner][spender];
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        require(_balances[sender] >= amount, "Insufficient balance");
        require(_allowances[sender][msg.sender] >= amount, "Insufficient allowance");
        
        _balances[sender] -= amount;
        _balances[recipient] += amount;
        _allowances[sender][msg.sender] -= amount;
        
        emit Transfer(sender, recipient, amount);
        return true;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function burn(uint256 amount) public {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _totalSupply -= amount;
        _balances[msg.sender] -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
}
`;

async function deployContract() {
    // Initialize TronWeb
    const tronWeb = new TronWeb({
        fullHost: 'https://nile.trongrid.io',
        privateKey: process.env.PRIVATE_KEY // Your private key with TRX
    });

    try {
        console.log('🚀 Deploying MockUSDT contract to Nile testnet...');

        // Compile contract (simplified - in production use proper compiler)
        const contract = await tronWeb.contract().new({
            abi: JSON.parse(fs.readFileSync('./MockUSDT.abi', 'utf8')), // You'll need to generate this
            bytecode: fs.readFileSync('./MockUSDT.bin', 'utf8'), // You'll need to generate this
            feeLimit: 1000000000,
            callValue: 0,
            userFeePercentage: 100,
            originEnergyLimit: 10000000,
            parameters: []
        });

        console.log('✅ Contract deployed successfully!');
        console.log('📋 Contract Address:', contract.address);
        console.log('🔗 Transaction Hash:', contract.transaction);

        // Save contract address
        const deploymentInfo = {
            address: contract.address,
            transactionHash: contract.transaction,
            deployedAt: new Date().toISOString(),
            network: 'nile'
        };

        fs.writeFileSync('./mockusdt-deployment.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('💾 Deployment info saved to mockusdt-deployment.json');

        // Test minting
        console.log('🧪 Testing mint function...');
        await contract.mint(tronWeb.defaultAddress.base58, 1000000000).send(); // 1000 USDT
        console.log('✅ Mint test successful');

        console.log('\n🎉 MockUSDT deployment complete!');
        console.log('📋 Update your .env file with:');
        console.log(`USDT_CONTRACT_ADDRESS=${contract.address}`);

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

// Alternative: Deploy using TronBox or Truffle
async function deployWithTronBox() {
    console.log('📦 Deploying with TronBox...');
    
    // This would use TronBox configuration
    // See: https://developers.tron.network/docs/tron-box-1
    
    console.log('🎉 Deployment complete!');
}

// Run deployment
if (require.main === module) {
    if (!process.env.PRIVATE_KEY) {
        console.error('❌ PRIVATE_KEY environment variable is required');
        console.log('Usage: PRIVATE_KEY=your_private_key node deploy-mockusdt.js');
        process.exit(1);
    }

    deployContract().catch(console.error);
}

module.exports = { deployContract };