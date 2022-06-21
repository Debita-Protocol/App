import React, {useState, useEffect} from 'react'
import { ethers } from 'ethers'

import Web3 from 'web3';
import { connected } from 'process'

let eth;



if (typeof window !== 'undefined') {
  eth = window.ethereum
}
const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const transactionContract = new ethers.Contract(
        contractAddress,
      contractABI,
      signer,
    )
  
    return transactionContract
  }
async function loadWeb3() {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        window.ethereum.enable();
    }
}

export const MintContext = React.createContext();

// async function getCollateralContract(){
//   return await new window.web3.eth.Contract(collateralABI, collateralAddress)
// }
// async function getAmmFactoryContract() {
//     return await new window.web3.eth.Contract(ammFactoryABI, ammFactoryAddress)
// }
// async function loadWeb3Contract() {
//   await loadWeb3()
//   window.contract = await getAmmFactoryContract()
// }
// async function loadCollateralContract(){
//   window.contract = await getCollateralContract() 
// }

export const MintProvider = ({children})=>{
    const [currentAccount, setCurrentAccount] = useState()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        addressTo: '',
        amount: '',
      })
    const connectWallet = async(metamask = eth) => {
        try {
            if (!metamask) return alert('Install Metamask')
            const accounts = await metamask.request({method:'eth_requestAccounts'})
            setCurrentAccount(accounts[0])

        }catch(error){
            console.error(error)
            throw new Error('no ethereum object')
        }

    }
    const checkIfWalletIsConnected = async (metamask = eth) => {
        try {
          if (!metamask) return alert('Please install metamask ')
    
          const accounts = await metamask.request({ method: 'eth_accounts' })
          if (accounts.length) {
            setCurrentAccount(accounts[0])
          }
          console.log('connected', accounts[0])

        } catch (error) {
          console.error(error)
          throw new Error('No ethereum object.')
        }
      }
    
    const buyCDS = async(
      metamask = eth, connectedAccount = currentAccount
    )=>{
      try{
        if (!metamask) return alert('connect')
        const {addressTo, amount} = formData
        await loadCollateralContract()
        console.log(window.contract)
        console.log(connectedAccount)
       // const  parsedAmount = ethers.utils.parseEther(amount)
       await window.contract.methods.approve(ammFactoryAddress,100000 ).send({
         from:connectedAccount
       })
       await loadWeb3Contract()

        await window.contract.methods.buy("0x3Aa5ebB10DC797CAC828524e59A333d0A371443c",1, 0, 100000, 1).send({from:connectedAccount})
       // const coolNumber = await window.contract.methods.setCoolNumber(value).send({ from: account });
       // await ammFactory.m.buy("0x3Aa5ebB10DC797CAC828524e59A333d0A371443c", 
      //                        1, 0, 100000, 1).send({from:connectedAccount})

    }catch(error){
        console.log(error)
    }
    }



      const sendTransaction = async(
          metamask = eth, 
          connectedAccount = currentAccount
      )=>{
          try{
              if (!metamask) return alert('connect')
              const {addressTo, amount} = formData
              const transactionContract = getEthereumContract()
              const  parsedAmount = ethers.utils.parseEther(amount)
              
              await metamask.request({method: 'eth_sendTransaction',
            params: [
                {
                    from: connectedAccount,
                    to: addressTo, 
                    gas:'0x7EF40',
                    value: parsedAmount._hex, 
                },
            ],})

            const transactionHash = await transactionContract.publishTransaction(
                addressTo, parsedAmount, 'transfering', 'TRANSFER'
            )
            setIsLoading(true)
            await transactionHash.wait()
            console.log('sending transaction...')
            await saveTransaction(transactionHash.hash, amount, connectedAccount, addressTo)
            setIsLoading(false)
          }catch(error){
              console.log(error)
          }
      }

    const handleChange = (e, name) => {
    console.log(name, e.target.value)
    setFormData(prevState => ({ ...prevState, [name]: e.target.value }))
    }

    return (
        <MintContext.Provider 
        value = {{currentAccount, connectWallet, 
            checkIfWalletIsConnected,
            sendTransaction, 
            handleChange,
            formData, 
            buyCDS,
            
        }}>
        {children}
        </MintContext.Provider>
    )
}