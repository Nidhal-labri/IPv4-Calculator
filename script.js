// IPv4 Subnet Calculator
class IPv4Calculator {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const calculateBtn = document.getElementById("calculate-btn");
        const ipInput = document.getElementById("ip-address");
        const subnetInput = document.getElementById("subnet-mask");

        calculateBtn.addEventListener("click", () => this.calculate());
        
        // Real-time calculation on input
        ipInput.addEventListener("input", () => this.debounceCalculate());
        subnetInput.addEventListener("input", () => this.debounceCalculate());

        // Real-time validation
        ipInput.addEventListener("blur", () => this.validateIP(ipInput.value));
        subnetInput.addEventListener("blur", () => this.validateSubnetMask(subnetInput.value));
    }

    debounceCalculate() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const ip = document.getElementById("ip-address").value.trim();
            const subnet = document.getElementById("subnet-mask").value.trim();
            if (ip && subnet) {
                this.calculate();
            }
        }, 500);
    }

    calculate() {
        const ipAddress = document.getElementById("ip-address").value.trim();
        const subnetMask = document.getElementById("subnet-mask").value.trim();

        // Clear previous error messages
        this.clearErrors();

        try {
            // Input validation
            if (!this.validateIP(ipAddress)) {
                throw new Error("Invalid IP Address");
            }

            if (!this.validateSubnetMask(subnetMask)) {
                throw new Error("Invalid Subnet Mask");
            }

            // Subnet mask conversion
            const subnetDecimal = this.convertSubnetMask(subnetMask);
            const cidrNotation = this.getCIDRFromSubnetMask(subnetDecimal);

            // Network parameter calculations
            const networkAddress = this.calculateNetworkAddress(ipAddress, subnetDecimal);
            const broadcastAddress = this.calculateBroadcastAddress(networkAddress, subnetDecimal);
            const hostRange = this.calculateHostRange(networkAddress, broadcastAddress);
            const hostCount = this.calculateHostCount(cidrNotation);
            const subnetBinary = this.convertToBinary(subnetDecimal);
            const networkClass = this.getNetworkClass(ipAddress);

            // Display results
            this.displayResults({
                networkAddress,
                broadcastAddress,
                hostRange,
                hostCount,
                subnetDecimal,
                subnetBinary,
                cidrNotation,
                networkClass
            });

        } catch (error) {
            this.showError(error.message);
        }
    }

    validateIP(ip) {
        const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const match = ip.match(ipRegex);
        
        if (!match) return false;

        for (let i = 1; i <= 4; i++) {
            const octet = parseInt(match[i]);
            if (octet < 0 || octet > 255) return false;
        }

        return true;
    }

    validateSubnetMask(mask) {
        // Check CIDR format (/xx)
        if (mask.startsWith("/")) {
            const cidr = parseInt(mask.substring(1));
            return cidr >= 0 && cidr <= 32;
        }

        // Check decimal format (xxx.xxx.xxx.xxx)
        if (!this.validateIP(mask)) return false;

        // Check if it's a valid subnet mask
        const octets = mask.split(".").map(Number);
        const binary = octets.map(octet => 
            octet.toString(2).padStart(8, "0")
        ).join("");

        // A valid mask must have all 1s followed by all 0s
        const regex = /^1*0*$/;
        return regex.test(binary);
    }

    convertSubnetMask(mask) {
        if (mask.startsWith("/")) {
            const cidr = parseInt(mask.substring(1));
            return this.cidrToDecimal(cidr);
        }
        return mask;
    }

    cidrToDecimal(cidr) {
        const binary = "1".repeat(cidr) + "0".repeat(32 - cidr);
        const octets = [];
        
        for (let i = 0; i < 4; i++) {
            const octet = binary.substring(i * 8, (i + 1) * 8);
            octets.push(parseInt(octet, 2));
        }
        
        return octets.join(".");
    }

    getCIDRFromSubnetMask(mask) {
        const octets = mask.split(".").map(Number);
        const binary = octets.map(octet => 
            octet.toString(2).padStart(8, "0")
        ).join("");
        
        return binary.split("1").length - 1;
    }

    calculateNetworkAddress(ip, mask) {
        const ipOctets = ip.split(".").map(Number);
        const maskOctets = mask.split(".").map(Number);
        
        const networkOctets = ipOctets.map((octet, index) => 
            octet & maskOctets[index]
        );
        
        return networkOctets.join(".");
    }

    calculateBroadcastAddress(networkAddress, mask) {
        const networkOctets = networkAddress.split(".").map(Number);
        const maskOctets = mask.split(".").map(Number);
        
        const broadcastOctets = networkOctets.map((octet, index) => 
            octet | (255 - maskOctets[index])
        );
        
        return broadcastOctets.join(".");
    }

    calculateHostRange(networkAddress, broadcastAddress) {
        const networkOctets = networkAddress.split(".").map(Number);
        const broadcastOctets = broadcastAddress.split(".").map(Number);
        
        // First host address (network + 1)
        const firstHost = [...networkOctets];
        firstHost[3] += 1;
        if (firstHost[3] > 255) {
            firstHost[3] = 0;
            firstHost[2] += 1;
            if (firstHost[2] > 255) {
                firstHost[2] = 0;
                firstHost[1] += 1;
                if (firstHost[1] > 255) {
                    firstHost[1] = 0;
                    firstHost[0] += 1;
                }
            }
        }
        
        // Last host address (broadcast - 1)
        const lastHost = [...broadcastOctets];
        lastHost[3] -= 1;
        if (lastHost[3] < 0) {
            lastHost[3] = 255;
            lastHost[2] -= 1;
            if (lastHost[2] < 0) {
                lastHost[2] = 255;
                lastHost[1] -= 1;
                if (lastHost[1] < 0) {
                    lastHost[1] = 255;
                    lastHost[0] -= 1;
                }
            }
        }
        
        return `${firstHost.join(".")} - ${lastHost.join(".")}`;
    }

    calculateHostCount(cidr) {
        const hostBits = 32 - cidr;
        return Math.pow(2, hostBits) - 2; // -2 to exclude network and broadcast
    }

    convertToBinary(ip) {
        return ip.split(".").map(octet => 
            parseInt(octet).toString(2).padStart(8, "0")
        ).join(".");
    }

    getNetworkClass(ip) {
        const firstOctet = parseInt(ip.split(".")[0]);
        
        if (firstOctet >= 1 && firstOctet <= 126) {
            return "Class A (1-126)";
        } else if (firstOctet >= 128 && firstOctet <= 191) {
            return "Class B (128-191)";
        } else if (firstOctet >= 192 && firstOctet <= 223) {
            return "Class C (192-223)";
        } else if (firstOctet >= 224 && firstOctet <= 239) {
            return "Class D (Multicast)";
        } else if (firstOctet >= 240 && firstOctet <= 255) {
            return "Class E (Reserved)";
        } else {
            return "Unknown Class";
        }
    }

    displayResults(results) {
        document.getElementById("network-address").textContent = results.networkAddress;
        document.getElementById("broadcast-address").textContent = results.broadcastAddress;
        document.getElementById("host-range").textContent = results.hostRange;
        document.getElementById("host-count").textContent = results.hostCount.toLocaleString();
        document.getElementById("subnet-decimal").textContent = results.subnetDecimal;
        document.getElementById("subnet-binary").textContent = results.subnetBinary;
        document.getElementById("cidr-notation").textContent = `/${results.cidrNotation}`;
        document.getElementById("network-class").textContent = results.networkClass;

        // Animation for results appearance
        const resultsSection = document.getElementById("results-section");
        resultsSection.style.opacity = "0";
        resultsSection.style.transform = "translateY(20px)";
        
        setTimeout(() => {
            resultsSection.style.transition = "all 0.5s ease-out";
            resultsSection.style.opacity = "1";
            resultsSection.style.transform = "translateY(0)";
        }, 100);
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.querySelector(".error-message");
        if (!errorDiv) {
            errorDiv = document.createElement("div");
            errorDiv.className = "error-message";
            document.querySelector(".input-section").appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        // Add error class to fields
        document.getElementById("ip-address").classList.add("error");
        document.getElementById("subnet-mask").classList.add("error");
    }

    clearErrors() {
        const errorDiv = document.querySelector(".error-message");
        if (errorDiv) {
            errorDiv.remove();
        }
        
        document.getElementById("ip-address").classList.remove("error");
        document.getElementById("subnet-mask").classList.remove("error");
    }
}

// Additional utilities
class NetworkUtils {
    static isPrivateIP(ip) {
        const octets = ip.split(".").map(Number);
        const firstOctet = octets[0];
        const secondOctet = octets[1];
        
        // 10.0.0.0/8
        if (firstOctet === 10) return true;
        
        // 172.16.0.0/12
        if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) return true;
        
        // 192.168.0.0/16
        if (firstOctet === 192 && secondOctet === 168) return true;
        
        return false;
    }

    static getSubnetInfo(cidr) {
        const subnets = Math.pow(2, cidr);
        const hosts = Math.pow(2, 32 - cidr) - 2;
        
        return {
            totalSubnets: subnets,
            hostsPerSubnet: hosts,
            subnetMask: this.cidrToDecimal(cidr)
        };
    }

    static cidrToDecimal(cidr) {
        const binary = "1".repeat(cidr) + "0".repeat(32 - cidr);
        const octets = [];
        
        for (let i = 0; i < 4; i++) {
            const octet = binary.substring(i * 8, (i + 1) * 8);
            octets.push(parseInt(octet, 2));
        }
        
        return octets.join(".");
    }
}

// Application initialization
document.addEventListener("DOMContentLoaded", () => {
    new IPv4Calculator();
    
    // Predefined examples
    const examples = [
        { ip: "192.168.1.100", mask: "255.255.255.0" },
        { ip: "10.0.0.50", mask: "/24" },
        { ip: "172.16.10.1", mask: "255.255.240.0" }
    ];
    
    // Add example buttons (optional)
    const inputSection = document.querySelector(".input-section");
    const exampleDiv = document.createElement("div");
    exampleDiv.className = "examples";
    exampleDiv.innerHTML = `
        <p style="margin: 20px 0 10px 0; font-weight: 500; color: var(--text-secondary);">
            <i class="fas fa-lightbulb"></i> Quick Examples:
        </p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${examples.map((ex, i) => 
                `<button class="example-btn" data-ip="${ex.ip}" data-mask="${ex.mask}" 
                 style="padding: 8px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; 
                        border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;">
                    ${ex.ip} ${ex.mask}
                </button>`
            ).join("")}
        </div>
    `;
    
    inputSection.appendChild(exampleDiv);
    
    // Event handler for examples
    document.querySelectorAll(".example-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const ip = e.target.dataset.ip;
            const mask = e.target.dataset.mask;
            
            document.getElementById("ip-address").value = ip;
            document.getElementById("subnet-mask").value = mask;
            
            // Auto-calculate
            setTimeout(() => {
                new IPv4Calculator().calculate();
            }, 100);
        });
        
        // Hover effect
        btn.addEventListener("mouseenter", (e) => {
            e.target.style.background = "#e2e8f0";
            e.target.style.borderColor = "#cbd5e1";
        });
        
        btn.addEventListener("mouseleave", (e) => {
            e.target.style.background = "#f1f5f9";
            e.target.style.borderColor = "#e2e8f0";
        });
    });
});

