"use client";

import { AppHero } from '../ui/ui-layout';
import { Account, Keypair, LAMPORTS_PER_SOL, PublicKey, Signer } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';


import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
} from '../account/account-data-access';

import {
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  mintToChecked,
  setAuthority,
  transfer,
  burn,
  approve
} from '@solana/spl-token';


export default function DashboardFeature() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [payer, setPayer]                       = useState<Signer | undefined>(undefined);
  const [mintPubkey, setMintPubkey]             = useState<PublicKey | undefined>(undefined);
  const [tokenAccount, setTokenAccount]         = useState<Account | null>(null);
  const [isInit, setIsInit]                     = useState(false);
  const [mintTransaction, setMintTx]            = useState("");
  const [balanceToken, setBalanceToken]         = useState<number>(0);
  const [amount, setAmount]                     = useState<number>(1);
  const [destination, setDestination]           = useState<string>('');
  const [transferTransaction, setTransferTx]    = useState("");
  const [burnAmount, setBurnAmount]             = useState<number>(1);
  const [burnTransaction, setBurnTx]            = useState("");
  const [delegation, setDelegation]             = useState<string>('');
  const [delegateAmount, setDelegateAmount]     = useState<number>(10);
  const [delegationWallet, setDelegationWallet] = useState<Signer | undefined>(undefined);
  const [airdropTransaction, setAidropTx]       = useState("");
  const [approveTransaction, setApproveTx]      = useState("");
  const [errorMessage, setErrorMessage]         = useState("");


  let pk: PublicKey;
  pk = wallet.publicKey!;

  const decimals   = 9;
  const nn_tokens = 100;
  const mintAmount = nn_tokens * Math.pow(10, decimals);

  const { data: balance } = useGetBalance(
    pk ? { address: pk } : { address: new PublicKey('11111111111111111111111111111111') }
  );

  const { data: balancePayer } = useGetBalance(
    payer?.publicKey ? { address: payer.publicKey } : { address: new PublicKey('11111111111111111111111111111111') }
  );

  const mainInit = async () => {
    const destinationWallet = await Keypair.generate().publicKey.toBase58();
    setDestination(destinationWallet);

    const newPayer = await Keypair.generate();
    console.log("mainInit (payer)"+newPayer.publicKey.toBase58());

    const airdropSignature = await connection.requestAirdrop(newPayer.publicKey, 2 * LAMPORTS_PER_SOL);
    connection.confirmTransaction(airdropSignature).then(()=> {
      setPayer(newPayer);
      setAidropTx(airdropSignature);
    })

    const newDelegationWallet = await Keypair.generate();
    console.log("mainInit (delegation)"+ newDelegationWallet.publicKey.toBase58());
    setDelegation(newDelegationWallet.publicKey.toBase58());
    setDelegationWallet(newDelegationWallet);

    const airdropDelegSignature = await connection.requestAirdrop(newDelegationWallet.publicKey, 2 * LAMPORTS_PER_SOL);
    connection.confirmTransaction(airdropDelegSignature).then(()=> {
      console.log("Airdrop delegation !");
    })

  };


  useEffect(()=>{
    let isMounted = true;
    if(!isInit && isMounted) {
      mainInit();
      console.log("useEffect");
      setIsInit(true);
    }
    return () => {
      isMounted = false;
    };
  },[isInit]);


  return (
    <div>
      <AppHero title="SPL-Token exercice" subtitle="I'm not a frontend developer 🥵" />

      <div className="max-w-xxl mx-auto py-6 sm:px-6 lg:px-8 text-left">

        <hr />
        <p>&nbsp;</p>
        <p><b>Step 1 - A payer account is created, with some cash</b></p>
        <p>&nbsp;</p>
        <p><b>Payer key :</b> {payer?.publicKey.toBase58()}</p>
        <p><b>Payer balance :</b> {balancePayer}</p>
        <p><b>Airdrop transaction :</b> {airdropTransaction}</p>
        <p>&nbsp;</p>
        <hr />
        <p>&nbsp;</p>

        <button
          className="btn btn-xs lg:btn-md btn-outline"

          onClick={ async() => {
            console.log("Create Token & ATA");
            console.log("payer ", payer?.publicKey.toBase58());

            if( !payer ) {
              const errMessage = "null data";
              setErrorMessage(errMessage);
              console.log(errMessage);
              return;
            }

            try {
              let newMintPubkey = await createMint(
                connection      ,   // connection
                payer           ,   // fee payer
                payer.publicKey,    // mint authority
                null           ,    // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
                decimals       ,    // decimals
              );
              setMintPubkey(newMintPubkey);
              console.log(newMintPubkey.toBase58());

              const newTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                payer,
                newMintPubkey,
                payer.publicKey
              );

              console.log("Token Account");
              console.log("ATA", newTokenAccount.address.toBase58());
              setTokenAccount(newTokenAccount);

            } catch(err) {
              const errMessage = "Error during creation of token account: "+err;
              setErrorMessage(errMessage);
              console.error(errMessage);
            }

          }}
        >Create Token</button>

        <p>{ mintPubkey != null &&
          (
            <div>
              <p>&nbsp;</p>
              <p><b>Step 2 - The Token Mint account is created with its associated Token Account</b></p>
              <p>&nbsp;</p>
              <p><b>Token Mint address :</b> {mintPubkey?.toBase58()}</p>
              <p><b>Associated Token Account address :</b> {tokenAccount?.address.toBase58()}</p>
              <p>&nbsp;</p>
              <hr />

              <p>&nbsp;</p>
              <button
                className="btn btn-xs lg:btn-md btn-outline"
                onClick={ async() => {
                  console.log("Mint Tokens");
                  //console.log("ATA",tokenAccount?.address.toBase58());

                  if( !payer || !tokenAccount) {
                    console.log("null data");
                    return;
                  }
                  console.log("check");
                  console.log(connection);
                  console.log(payer.publicKey.toBase58());
                  console.log(mintPubkey.toBase58());
                  console.log(tokenAccount.address.toBase58());
                  console.log(mintAmount);
                  console.log("check");
                  try {

                    let mintTx = await mintTo(
                      connection          ,            // connection
                      payer               ,            // payer
                      mintPubkey          ,            // mint
                      tokenAccount.address,            // destination
                      payer.publicKey     ,            // authority
                      mintAmount                       // amount
                    );
                    console.log('Mint Transaction:', mintTx);
                    setMintTx(mintTx);

                    await setAuthority(
                      connection,
                      payer          ,      // Payer of the transaction fees
                      mintPubkey     ,      // Account 
                      payer.publicKey,      // Current authority 
                      0              ,      // Authority type: "0" represents Mint Tokens 
                      null                  // Setting the new Authority to null
                    );
                    console.log('Authority is set !');

                    const tokenAccountInfo = await getAccount(
                      connection,
                      tokenAccount.address
                    );
                    console.log('Token Account Info:', tokenAccountInfo.amount);
                    const newBalanceToken = tokenAccountInfo.amount / BigInt(Math.pow(10, decimals));
                    console.log(newBalanceToken);
                    setBalanceToken(Number(newBalanceToken));

                  } catch(err) {
                    const errMessage = "Error during tokens minting: "+err;
                    setErrorMessage(errMessage);
                    console.error(errMessage);
                  }
                
                }}
              >Mint Token</button>
            </div>
          )
        }</p>

        <p>{ mintTransaction != "" && (
            <div>
              <p>&nbsp;</p>
              <p><b>Step 3 - {nn_tokens} tokens are minted now</b></p>
              <p>&nbsp;</p>
              <p><b>Mint transaction :</b> {mintTransaction}</p>
              <p><b>Token balance :</b> {balanceToken}</p>
              <p>&nbsp;</p>
              <hr />
              <p>&nbsp;</p>

              <button
                className="btn btn-xs lg:btn-md btn-outline"onClick={ async() => {
                  if( amount > 0 && amount <= balanceToken && destination != "") {
                    console.log("It's OK !!!");

                    try {

                      const pk = new PublicKey(destination);
                      console.log(pk.toBase58()); // Affiche l'objet PublicKey,puis en base58

                      if( !payer || !mintPubkey || !tokenAccount) {
                        console.log("null data");
                        return;
                      }

                      // Get the token account of the toWallet Solana address. If it does not exist, create it.
                      const toATA = await getOrCreateAssociatedTokenAccount(
                        connection,
                        payer,
                        mintPubkey,
                        pk
                      );
                      console.log("Token Account");
                      console.log("ATA (to)", toATA.address.toBase58());

                      let tx = await transfer(
                        connection          ,                // connection
                        payer               ,                // payer
                        tokenAccount.address,                // source account
                        toATA.address       ,                // destination account
                        payer.publicKey     ,                // destination **
                        amount*Math.pow     (10,decimals),   // amount
                      );
                      setTransferTx(tx);

                      const tokenAccountInfo = await getAccount(
                        connection,
                        tokenAccount.address
                      );
                      console.log('Token Account Info:', tokenAccountInfo.amount);
                      const newBalanceToken = tokenAccountInfo.amount / BigInt(Math.pow(10, decimals));
                      console.log(newBalanceToken);
                      setBalanceToken(Number(newBalanceToken));

                      // console.log('Token Account Info:', toATA.amount);
                      // const newToATA = toATA.amount / BigInt(Math.pow(10, decimals));
                      // console.log(newToATA);


                    } catch(err) {
                      const errMessage = "Error during transfer of tokens: "+err;
                      setErrorMessage(errMessage);
                      console.error(errMessage);
                    }
                  
                  } else {
                    console.log("Not OK !!!");
                  }

                }}
              >Transfer to...</button>
              <p>&nbsp;</p>
              <p><b>Step 4 - Ready to tranfer an amount of tokens to this address ?</b></p>
              <p>&nbsp;</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                    type        = "text"
                    value       = {destination}
                    onChange    = {(e) => setDestination(e.target.value)}
                    placeholder = "Destination"
                />

                <input
                    type        = "number"
                    value       = {amount}
                    onChange    = {(e) => setAmount(Number(e.target.value))}
                    placeholder = "Amount"
                />

              </div>

            </div>
          )

        }</p>
  
        <p>{ transferTransaction != "" && (
          <div>
            <p>&nbsp;</p>
            <p><b>Transfer transaction :</b> {transferTransaction}</p>
            <p><b>Token balance :</b> {balanceToken}</p>
            <p>&nbsp;</p>
            <hr />
            <p>&nbsp;</p>

            <button
              className="btn btn-xs lg:btn-md btn-outline"onClick={ async() => {
                if( burnAmount > 0 && burnAmount <= balanceToken) {

                  if( !payer || !mintPubkey || !tokenAccount) {
                    console.log("null data");
                    return;
                  }

                  try {
                    const newBurnSignature = await burn(
                      connection,
                      payer                ,   // Payer of the transaction fees
                      tokenAccount.address,    // Address of the account holding the tokens to burn
                      mintPubkey           ,   // Mint of the token
                      payer.publicKey      ,   // Owner of the account
                      burnAmount*Math.pow(10,decimals)          ,    // Amount of tokens to burn
                    );
                    setBurnTx(newBurnSignature);

                    const tokenAccountInfo = await getAccount(
                      connection,
                      tokenAccount.address
                    );
                    console.log('Token Account Info:', tokenAccountInfo.amount);
                    const newBalanceToken = tokenAccountInfo.amount / BigInt(Math.pow(10, decimals));
                    console.log(newBalanceToken);
                    setBalanceToken(Number(newBalanceToken));

                  } catch(err) {
                    const errMessage = "Error during burning processus: "+err;
                    setErrorMessage(errMessage);
                    console.error(errMessage);
                  }
                
                }
              }}
            >Let's burn some tokens !</button>
            <p>&nbsp;</p>
            <p><b>Step 5 - You can burn a amount of tokens from the supply !</b></p>
            <p>&nbsp;</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                  type        = "number"
                  value       = {burnAmount}
                  onChange    = {(e) => setBurnAmount(Number(e.target.value))}
                  placeholder = "Amount to burn"
              />
            </div>
          </div>
        )}</p>

  
        <p>{ burnTransaction != "" && (
          <div>
            <p>&nbsp;</p>
            <p><b>Burn transaction :</b> {burnTransaction}</p>
            <p><b>Token balance :</b> {balanceToken}</p>
            <p>&nbsp;</p>
            <hr />
            <p>&nbsp;</p>
            <button
              className="btn btn-xs lg:btn-md btn-outline"onClick={ async() => {
                if(delegation != "") {

                  if( !payer || !mintPubkey || !tokenAccount) {
                    console.log("null data");
                    return;
                  }

                  try {

                    const pk = new PublicKey(delegation);
                    console.log(pk.toBase58()); // Affiche l'objet PublicKey,puis en base58

                    const approveSignature = await approve(
                      connection,
                      payer,                // Payer of the transaction fees
                      tokenAccount.address, // Account from which tokens can be transferred
                      pk,                   // Delegate authority
                      payer.publicKey,      // Owner of the token account
                      delegateAmount*Math.pow(10,decimals)            // Amount of tokens the delegate is allowed to transfer
                    );
                    console.log("Delegation");
                    console.log(approveSignature);
                    setApproveTx(approveSignature);

                  } catch(err) {
                    const errMessage = "Error during delegation processus: "+err;
                    setErrorMessage(errMessage);
                    console.error(errMessage);
                  }
                
                }
              }}
            >Delegation to...</button>
            <p>&nbsp;</p>
            <p><b>Step 6 - You can now delegate the transfer of an amount of tokens with this address !</b></p>
            <p>&nbsp;</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                  type        = "text"
                  value       = {delegation}
                  onChange    = {(e) => setDelegation(e.target.value)}
                  placeholder = "Delegation"
              />

              <input
                type        = "number"
                value       = {delegateAmount}
                onChange    = {(e) => setDelegateAmount(Number(e.target.value))}
                placeholder = "Delegate amount"
              />

            </div>

          </div>
        )}</p>

        <p>{ approveTransaction != "" && (
          <div>
            <p>&nbsp;</p>
            <p><b>Delegate key :</b> {delegation}</p>
            <p><b>Destination key :</b> {destination}</p>
            <p><b>Approve transaction :</b> {approveTransaction}</p>
            <p>&nbsp;</p>
            <hr />
            <p>&nbsp;</p>

            <button
              className="btn btn-xs lg:btn-md btn-outline"onClick={ async() => {
                if( (approveTransaction != "") && (balanceToken >= 1) ) {

                  if( !payer || !delegationWallet || !mintPubkey || !tokenAccount) {
                    console.log("null data");
                    return;
                  }


                  try {

                    const pkDelegation = new PublicKey(delegation);
                    console.log(pkDelegation.toBase58());
                    const pkDestination = new PublicKey(destination);
                    console.log(pkDestination.toBase58());

                    // Get the token account of the toWallet Solana address. If it does not exist, create it.
                    const toATA = await getOrCreateAssociatedTokenAccount(
                      connection,
                      payer,
                      mintPubkey,
                      pkDestination
                    );
                    console.log("Token Account");
                    console.log("ATA (to)", toATA.address.toBase58());

                    const delegateTransferAmount = 1;

                    const delegateTransferSignature = await transfer(
                      connection,
                      delegationWallet,            // Payer of the transaction fees X
                      tokenAccount.address,           // Source account X
                      toATA.address,      // Destination account X
                      pkDelegation,  // Delegated authority
                      delegateTransferAmount*Math.pow(10,decimals)     // Number of tokens to transfer
                    );
                    console.log("Delegate Transfer Signature:", delegateTransferSignature);

                    const tokenAccountInfo = await getAccount(
                      connection,
                      tokenAccount.address
                    );
                    const newBalanceToken = tokenAccountInfo.amount / BigInt(Math.pow(10, decimals));
                    console.log(newBalanceToken);
                    setBalanceToken(Number(newBalanceToken));

                  } catch(err) {
                    const errMessage = "Error during delegate token transfer: "+err;
                    setErrorMessage(errMessage);
                    console.error(errMessage);
                  }
                
                }
              }}
            >Delegate transfer</button>
            <p>&nbsp;</p>
            <p><b>Step 7 - Transfer 1 token to the destination address via delegate account !</b></p>
            <p>&nbsp;</p>
            <p><b>Token balance :</b> {balanceToken}</p>

          </div>

        )}</p>

        <p>{ errorMessage != "" && (
          <div>
            <p>&nbsp;</p>
            <p style={{ color: 'red', fontWeight: 'bold' }}>{errorMessage}</p>
          </div>
        )}</p>

      </div>
    </div>
  );
}
