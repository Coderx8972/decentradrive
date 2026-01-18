// client/src/hooks/useContract.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import FileStorageABI from '../contracts/FileStorage.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export const useContract = (provider) => {
    const [contract, setContract] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        if (provider && CONTRACT_ADDRESS) {
            const initContract = async () => {
                try {
                    const signerInstance = await provider.getSigner();
                    const contractInstance = new ethers.Contract(
                        CONTRACT_ADDRESS,
                        FileStorageABI.abi,
                        signerInstance
                    );

                    const accountAddress = await signerInstance.getAddress();

                    setSigner(signerInstance);
                    setContract(contractInstance);
                    setAccount(accountAddress);
                } catch (error) {
                    console.error('Error initializing contract:', error);
                }
            };

            initContract();
        }
    }, [provider]);

    return { contract, signer, account };
};
