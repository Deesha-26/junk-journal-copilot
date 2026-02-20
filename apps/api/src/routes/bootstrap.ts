import { Router } from 'express';
export const bootstrapRouter = Router();
bootstrapRouter.get('/', (req,res)=>res.json({status:'ok', ownerId:req.ownerId, noTraining:true}));
