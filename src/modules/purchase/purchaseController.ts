import { NextFunction,Response } from "express";


const purchase= async(req:any,res:Response,next:NextFunction)=>{
    try {
        // console.log("creating RFQ");
        const companies=[];
        const products=[];
        const quotation_id=req.body;

    
        
    } catch (error) {
        // console.log("creating RFQ");
    }
}

export default {purchase}