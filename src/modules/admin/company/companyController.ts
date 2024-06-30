import excelToJson from "convert-excel-to-json";
import { NextFunction, Response, Request } from "express";
import {
  createSlug,
  generateAddressSlug,
  getFileName,
  getPinDetail,
  logoUrl,
  phoneFormat,
  photoUrl,
  removeFile,
  removeLogo,
  removePhoto,
  toLowerCase,
} from "../../../helpers/helper";
import constants from "../../../utils/constants";
import Company from "../../../models/company";
import message from "./companyConstant";
import mongoose from "mongoose";
import Address from "../../../models/address";
import User from "../../../models/user";

const addCompanyBulk = async (req: any, res: Response, next: NextFunction) => {
  try {
    let createdBy = req?.id;
    let emailOrPhone:any=[]
    let gstError:any=[]
    const data = excelToJson({
      sourceFile: req.file.path,
      sheets: ["companies"],
    });
    //costvlidate
    const validateColumns = async (data: any) => {
      const columns: any = [
        "Company Name",
        "Buyer/Supplier/Both",
        "Company Reference ID",
        "Company Email",
        "Company Contact Number",
        "Address Line 1",
        "Address Line 2",
        "City",
        "State",
        "Country",
        "PIN Code",
        "GSTIN",
        "Tags",
        "Full name",
        "Contact Number",
        "Email",
      ];
 
      for (let i in data) {
        if (!columns.includes(data[i])) {
          await removeFile(req.file.filename);
          throw {
            statusCode: constants.code.badRequest,
            message: `Invalid column name (${data[i]}). Kindly change the name & try again.`,
          };
        }
      }
      return true;
    };
 
    if (!data.companies.length) {
      await removeFile(req.file.filename);
      throw {
        statusCode: constants.code.badRequest,
        message: constants.message.recordNotFound,
      };
    } else if (Object.keys(data.companies[0]).length < 16) {
      await removeFile(req.file.filename);
      throw {
        statusCode: constants.code.badRequest,
        message: constants.message.columnMissing,
      };
    } else if (Object.keys(data.companies[0]).length > 16) {
      await removeFile(req.file.filename);
      throw {
        statusCode: constants.code.badRequest,
        message: constants.message.unwantedColumns,
      };
    } else {
      const columns = data.companies.shift();
      if ((await validateColumns(columns)) === true) {
        const superAdminData: any = await User.findOne({
          role: constants.accountLevel.superAdmin,
          isDeleted: false,
          status: true,
        });
        for (let i = 0; i < data.companies.length; i++) {
          const pinCode: any = Object.values(data.companies[i])[10];
          const pindata: any = await getPinDetail(`${pinCode}`);
          const name: any = Object.values(data.companies[i])[0];
 
          if (!pinCode) {
            throw {
              statusCode: constants.code.dataNotFound,
              message: message.correctPin,
            };
          }
 
          if (!pindata) {
            throw {
              statusCode: constants.code.dataNotFound,
              message: `${message.correctPin} ${pinCode}`,
            };
          }
  //checking if company exists
          const companyData:any=await Company.findOne({
            "gst.value": Object.values(data.companies[i])[11],
            "companyEmail.value": Object.values(data.companies[i])[3],
            slug: await createSlug(name),
            // isDeleted: false,
            $or: [{ isDeleted: false }, { isDeleted: true }],
          })
          
              if (companyData) {
                //company exists check mail phone and GST numer
                const ckeckEmail: any = await Company.exists({
                  "companyEmail.value": Object.values(data.companies[i])[3],
                  _id: { $nin: [companyData._id] },
                  isDeleted: false,
                });
                const checkPhone: any = await Company.exists({
                  "companyPhone.value": await phoneFormat(
                    Object.values(data.companies[i])[4]
                  ),
                  _id: { $nin: [companyData._id] },
                  isDeleted: false,
                });
                const checkGst: any = await Company.exists({
                  "gst.value": Object.values(data.companies[i])[11],
                  _id: { $nin: [companyData._id] },
                  isDeleted: false,
                });
 
                if (ckeckEmail || checkPhone) {
                  // throw {
                  //   statusCode: constants.code.expectationFailed,
                  //   message: `Email or Phone already taken for ${name}`,
                  // };
                  emailOrPhone.push(Object.values(data.companies[i])[0])
                  continue
                }
                if (checkGst) {
                  // throw {
                  //   statusCode: constants.code.expectationFailed,
                  //   message: `Gst already taken for ${name}`,
                  // };
                  gstError.push(Object.values(data.companies[i])[0])
                  continue
                }
                //update the company details  of existing company
 
 
                await Company.findOneAndUpdate(
                  {
                    _id: companyData._id,
                    slug: await createSlug(name),
                    //isDeleted: false,
                    $or: [{ isDeleted: false }, { isDeleted: true }],
                  },
                  {
                    name: name,
                    slug: await createSlug(name),
                    buyerAndSupplier: Object.values(data.companies[i])[1],
                    reference_id: Object.values(data.companies[i])[2],
                    "companyEmail.value": Object.values(data.companies[i])[3],
                    "companyPhone.value": await phoneFormat(
                      Object.values(data.companies[i])[4]
                    ),
                    "gst.value": Object.values(data.companies[i])[11],
                    tags: Object.values(data.companies[i])[12],
                    contactPersonName: Object.values(data.companies[i])[13],
                    "contactPhone.value": await phoneFormat(
                      Object.values(data.companies[i])[14]
                    ),
                    "contactEmail.value": Object.values(data.companies[i])[15],
                    updatedBy: new mongoose.Types.ObjectId(req?.id),
                    isDeleted: false,
                  },
                  { new: true }
                )
                  .then(async (updatedCompany: any) => {
                    if (!updatedCompany) {
                      throw {
                        statusCode: constants.code.badRequest,
                        message: "failed to update company",
                      };
                    } else {
                      //if existing company details updated, update the address
                      await Address.findOneAndUpdate(
                        {
                          companyId: updatedCompany._id,
                          email: updatedCompany.companyEmail.value,
                          // isDeleted: false,
                          $or: [{ isDeleted: false }, { isDeleted: true }],
                        },
                        {
                          slug: await generateAddressSlug(
                            name,
                            constants.addressTypes.work,
                            pinCode
                          ),
                          name: name,
                          companyId: updatedCompany._id,
                          constraint: constants.constraint.primary,
                          type: constants.addressTypes.work,
                          email: updatedCompany.companyEmail.value,
                          phone: await phoneFormat(
                            companyData.companyPhone.value
                          ),
                          address: {
                            line_one: Object.values(data.companies[i])[3],
                            line_two: Object.values(data.companies[i])[4],
                            city: pindata.cityId,
                            state: pindata.stateId,
                            country: pindata.countryId,
                            pin_code: pinCode.toString(),
                          },
                          isDeleted: false,
                          updatedBy: new mongoose.Types.ObjectId(req?.id),
                        },
                        { upsert: true, new: true }
                      );
                    }
                  })
                  .catch((err) => {
                    return res.status(err.statusCode).json({
                      status: constants.status.statusFalse,
                      userStatus: req.status,
                      message: err.message,
                    });
                  });
 
                  // if(emailOrPhone.length){
                  //   throw{
                  //     statusCode:constants.code.expectationFailed,
                  //     message:`Duplicate Email or phone exists for ${emailOrPhone}`
                  //   }
                  // }
                  // else if(gstError.length){
                  //   throw{
                  //     statusCode:constants.code.expectationFailed,
                  //     message:`Duplicate Gst or  exists for ${gstError}`
                  //   }
                  // }
              }          
              else {
             //   if company not exists, create new company
                const existingEmail: any = await Company.exists({
                  "companyEmail.value": Object.values(data.companies[i])[3],
                  isDeleted: false,
                });
                const existingPhone: any = await Company.exists({
                  "companyPhone.value": await phoneFormat(
                    Object.values(data.companies[i])[4]
                  ),
                  isDeleted: false,
                });
 
                const existingGst: any = await Company.exists({
                  "gst.value": Object.values(data.companies[i])[11],
                  isDeleted: false,
                });
 
                if (existingEmail) {
                  // throw {
                  //   statusCode: constants.code.preconditionFailed,
                  //   message: `Email alredy taken for ${
                  //     Object.values(data.companies[i])[0]
                  //   }`,
                  // };
                  emailOrPhone.push(Object.values(data.companies[i])[0])
                  continue;
                } else if (existingPhone) {
                  // throw {
                  //   statusCode: constants.code.preconditionFailed,
                  //   message: `Phone alredy taken for ${
                  //     Object.values(data.companies[i])[0]
                  //   }`,
                  // };
                  emailOrPhone.push(Object.values(data.companies[i])[0])
                  continue;
                } else if (existingGst) {
                  // throw {
                  //   statusCode: constants.code.preconditionFailed,
                  //   message: `gst already taken for  ${
                  //     Object.values(data.companies[i])[0]
                  //   }`,
                  // };
                  gstError.push(Object.values(data.companies[i])[0])
                  continue;
                }
                
                  else {
                  await Company.create({
                    slug: await createSlug(name),
                    name: Object.values(data.companies[i])[0],
                    buyerAndSupplier: Object.values(data.companies[i])[1],
                    reference_id: Object.values(data.companies[i])[2],
                    "companyEmail.value": Object.values(data.companies[i])[3],
                    "companyPhone.value": await phoneFormat(
                      Object.values(data.companies[i])[4]
                    ),
                    "gst.value": Object.values(data.companies[i])[11],
                    tags: Object.values(data.companies[i])[12],
                    contactPersonName: Object.values(data.companies[i])[13],
                    "contactPhone.value": await phoneFormat(
                      Object.values(data.companies[i])[14]
                    ),
                    "contactEmail.value": Object.values(data.companies[i])[15],
                    createdBy: new mongoose.Types.ObjectId(req?.id),
                  })
                    .then(async (newCompany: any) => {
                      if (!newCompany) {
                        throw {
                          status: constants.code.badRequest,
                          message: "failed to create new Company",
                        };
                      } else {
                        await Address.create({
                          slug: await generateAddressSlug(
                            name,
                            constants.addressTypes.work,
                            pinCode
                          ),
                          name: name,
                          constraint: constants.constraint.primary,
                          type: constants.addressTypes.work,
                          email: newCompany.companyEmail.value,
                          companyId: newCompany._id,
                          phone: await phoneFormat(
                            newCompany.companyPhone.value
                          ),
                          address: {
                            line_one: Object.values(data.companies[i])[3],
                            line_two: Object.values(data.companies[i])[4],
                            city: pindata.cityId,
                            state: pindata.stateId,
                            country: pindata.countryId,
                            pin_code: pinCode.toString(),
                          },
                          createdBy: new mongoose.Types.ObjectId(req?.id),
                        });
                      }
                    })
                    .catch((err) => {
                      return res.status(err.statusCode).json({
                        status: constants.status.statusFalse,
                        userStatus: req.status,
                        message: err.message,
                      });
                    });
                }
 
                if(emailOrPhone.length){
                  throw{
                    statusCode:constants.code.expectationFailed,
                    message:`email or phone is duplicate for ${emailOrPhone}`
                  }
                }
                else if(existingGst){
                  throw{
                    statusCode:constants.code.expectationFailed,
                    message:`Gst is Duplicate for ${gstError}`
                  }
                }
              }           
        }
        await removeFile(req.file.filename);


        if(emailOrPhone.length>0){
          throw{
            statusCode:constants.code.preconditionFailed,
            message:`${emailOrPhone} have duplicate Phone Or Email, Kindly change and upload again`
          }
        }
        else if(gstError.length>0){
          throw{
            statusCode:constants.code.preconditionFailed,
            message:`${gstError} have duplicate Gst No., Kindly change and upload again`
          }
        }
        return res.status(constants.code.success).json({
          status: constants.status.statusTrue,
          userStatus: req.status,
          message: message.bulkCompanyUpload,
        });
      }
    }
  } catch (error: any) {
    res.status(constants.code.preconditionFailed).json({
      status: constants.status.statusFalse,
      userStatus: req.status,
      message: error.message?error.message:error
     })
    }
  };

const create = async (req: any, res: Response, next: NextFunction) => {
  try {
    const pinData = await getPinDetail(req.body.pin_code);
    if (!pinData) {
      throw {
        statusCode: constants.code.dataNotFound,
        message: constants.message.invalidPinCode,
      };
    }
    Company.findOne({
      "gst.value": req.body.gstNumber,
      slug: await createSlug(req.body.name),
      isDeleted: false,
    })
      .then(async (companyData) => {
        if (companyData) {
          throw {
            statusCode: constants.code.notAcceptable,
            message: message.companyExist,
          };
        } else {
          const existingEmail = await Company.findOne({
            "companyEmail.value": await toLowerCase(req.body.email),
            isDeleted: false,
          });

          if (existingEmail) {
            throw {
              statusCode: constants.code.notAcceptable,
              message: message.emailExists,
            };
          }

          // Check if the phone number already exists
          const existingPhone = await Company.findOne({
            "companyPhone.value": await phoneFormat(req.body.phone),
            isDeleted: false,
          });

          if (existingPhone) {
            throw {
              statusCode: constants.code.notAcceptable,
              message: message.phoneExists,
            };
          }
          Company.create({
            slug: await createSlug(req.body.name),
            name: req.body.name,
            reference_id: req.body.reference_id,
            "companyEmail.value": await toLowerCase(req.body.email),
            "companyPhone.value": await phoneFormat(req.body.phone),
            "contactEmail.value": await toLowerCase(req.body.contact_email),
            "contactPhone.value": await phoneFormat(req.body.contact_phone),
            contactPersonName: req.body.contactPersonName,
            buyerAndSupplier: req.body.buyerAndSupplier,
            gst: {
              value: req.body.gstNumber,
            },
            createdBy: new mongoose.Types.ObjectId(req?.id),
          })
            .then(async (newCompany: any) => {
              if (!newCompany) {
                throw {
                  statusCode: constants.code.preconditionFailed,
                  message: message.companyAddFailed,
                };
              } else {
                Address.findOneAndUpdate(
                  {
                    slug: await generateAddressSlug(
                      req.body.name,
                      constants.addressTypes.work,
                      pinData.pin_code
                    ),
                    email: newCompany.companyEmail.value,
                    isDeleted: false,
                  },
                  {
                    slug: await generateAddressSlug(
                      req.body.name,
                      constants.addressTypes.work,
                      pinData.pin_code
                    ),
                    name: req.body.name,
                    companyId: newCompany._id,
                    constraint: constants.constraint.primary,
                    type: constants.addressTypes.work,
                    email: newCompany.companyEmail?.value,
                    phone: newCompany.companyPhone?.value,
                    alternate_phone: req.body?.alternate_phone,
                    address: {
                      line_one: req.body.address_line_one,
                      line_two: req.body.address_line_two,
                      city: pinData.cityId,
                      state: pinData.stateId,
                      country: pinData.countryId,
                      pin_code: pinData.pinCode,
                    },
                    updatedBy: new mongoose.Types.ObjectId(req?.id),
                  },
                  {
                    new: true,
                    upsert: true,
                  }
                )
                  .then(async(addressCreated) => {
                    if (!addressCreated) {
                      throw {
                        status: constants.code.badRequest,
                        message: "failed to create address",
                      };
                    } 
                    else if(req.body.checked){
                            Address.create({
                              slug: await generateAddressSlug(
                                req.body.name,
                                req.body.address_type,
                                pinData.pinCode
                              ),
                              companyId: new mongoose.Types.ObjectId(
                                newCompany._id
                              ),
                              constraint: constants.constraint.secondary,
                              type: constants.addressTypes.shipping,
                              name: req.body.name,
                              email: newCompany.companyEmail.value,
                              phone: req.body.phone,
                              address: {
                                line_one: req.body.address_line_one,
                                line_two: req.body.address_line_two,
                                city: pinData.cityId,
                                state: pinData.stateId,
                                country: pinData.countryId,
                                pin_code: pinData.pinCode,
                              },
                              landmark: req.body.landmark,
                              latitude: req.body.latitude,
                              longitude: req.body.longitude,
                              createdBy: req.id,
                            }).then((same_address)=>{
                              if(!same_address){
                                throw{
                                  statusCode: constants.code.internalServerError,
                                  message:constants.message.invalidAddress
                                }
                              }
                              else{
                                res.status(constants.code.success).json({
                                  status: constants.status.statusTrue,
                                  userStatus: req.status,
                                  message: message.CompanySuccess,
                                });
                              }
                            })
                          }
                    
                    else {
                      res.status(constants.code.success).json({
                        status: constants.status.statusTrue,
                        userStatus: req.status,
                        message: message.CompanySuccess,
                      });
                    }
                  })
                  .catch((err) => {
                    //addressAdd failed
                    res.status(constants.code.preconditionFailed).json({
                      status: constants.status.statusTrue,
                      userStatus: req.status,
                      message: message.addAddFailed,
                    });
                  });
              }
            })
            .catch((err) => {
              //company creation failed error
              res
                .status(err.statusCode || constants.code.preconditionFailed)
                .json({
                  status: constants.status.statusFalse,
                  userStatus: req.status,
                  message: err.message,
                });
            });
        }
      })
      .catch((err) => {
        res.status(err.statusCode || constants.code.preconditionFailed).json({
          status: constants.status.statusFalse,
          userStatus: req.status,
          message: err.message,
        });
      });
  } catch (error: any) {
    res.status(constants.code.preconditionFailed).json({
      status: constants.status.statusFalse,
      userStatus: req.status,
      message: error,
    });
  }
};

const detail = async (req: any, res: Response, next: NextFunction) => {
  try {
    Company.findOne({
      _id: new mongoose.Types.ObjectId(req.params.company_id),
      isDeleted: false,
    })
      .then(async (companyDetails: any) => {
        if (!companyDetails) {
          throw {
            statusCode: constants.code.dataNotFound,
            message: constants.message.dataNotFound,
          };
        } else {
          Company.aggregate([
            { $match: { _id: companyDetails._id, isDeleted: false } },
            {
              $lookup: {
                from: "addresses",
                localField: "_id",
                foreignField: "companyId",
                as: "addressDetail",
              },
            },
            {
              $unwind: "$addressDetail",
            },
            {
              $match: {
                "addressDetail.constraint": "primary",
              },
            },
            {
              $lookup: {
                from: "cities",
                localField: "addressDetail.address.city",
                foreignField: "_id",
                as: "cityDetail",
              },
            },
            { $unwind: "$cityDetail" },
            {
              $lookup: {
                from: "states",
                localField: "addressDetail.address.state",
                foreignField: "_id",
                as: "stateDetail",
              },
            },
            { $unwind: "$stateDetail" },
            {
              $lookup: {
                from: "countries",
                localField: "stateDetail.countryId",
                foreignField: "_id",
                as: "countryDetail",
              },
            },
            { $unwind: "$countryDetail" },
            {
              $project: {
                city: "$cityDetail.name",
                state: "$stateDetail.name",
                country: "$countryDetail.name",
                contactPersonName: 1,
                contactEmail: 1,
                contactPhone: 1,
                companyEmail: 1,
                companyPhone: 1,
                logo: 1,
                logoUrl: 1,
                name: 1,
                gst: 1,
              },
            },
          ])
            .then(async (companyFullDetail: any) => {
              if (!companyFullDetail) {
                throw {
                  statusCode: constants.code.dataNotFound,
                  message: constants.message.dataNotFound,
                };
              } else {
                res.status(constants.code.success).json({
                  status: constants.status.statusFalse,
                  userStatus: req.status,
                  companyDetail: companyFullDetail,
                });
              }
            })
            .catch((err) => {
              res.status(err.statusCode).json({
                status: constants.status.statusFalse,
                userStatus: req.status,
                message: err.message,
              });
            });
        }
      })
      .catch((err) => {
        res.status(err.statusCode).json({
          status: constants.status.statusFalse,
          userStatus: req.status,
          message: err.message,
        });
      });
  } catch (error) {
    res.status(constants.code.preconditionFailed).json({
      status: constants.status.statusFalse,
      userStatus: req.status,
      message: error,
    });
  }
};

const update = async (req: any, res: Response, next: NextFunction) => {
  try {
    const phoneExists = await Company.exists({
      "companyPhone.value": await phoneFormat(req.body.phone),
      _id: { $nin: [new mongoose.Types.ObjectId(req.params.company_id)] },
      isDeleted: false,
    });

    const emailExists = await Company.exists({
      "companyEmail.value": req.body.email,
      _id: { $nin: [new mongoose.Types.ObjectId(req.params.company_id)] },
      isDeleted: false,
    });

    if (phoneExists) {
      throw {
        statusCode: constants.code.preconditionFailed,
        msg: constants.message.phoneTaken,
      };
    }

    if (emailExists) {
      throw {
        statusCode: constants.code.preconditionFailed,
        msg: constants.message.emailTaken,
      };
    }

    await Company.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.company_id),
        isDeleted: false,
      },
      {
        name: req.body.name,
        slug: await createSlug(req.body.name),
        "companyEmail.value": await toLowerCase(req.body.email),
        "companyPhone.value": await phoneFormat(req.body.phone),
        "contactEmail.value": await toLowerCase(req.body.contact_email),
        "contactPhone.value": await phoneFormat(req.body.contact_phone),
        contactPersonName: req.body.contactPersonName,
        gst: {
          value: req.body.gstNumber,
        },
        updatedBy: new mongoose.Types.ObjectId(req?.id),
      }
    )
      .then(async (updatedCompany) => {
        if (!updatedCompany) {
          throw {
            status: constants.message.dataNotFound,
            message: message.updateFailed,
          };
        } else {
          res.status(constants.code.success).json({
            status: constants.status.statusTrue,
            userStatus: req.status,
            message: message.updateSuccess,
          });
        }
      })
      .catch((err) => {
        res.status(err.statusCode || constants.code.dataNotFound).json({
          status: constants.status.statusFalse,
          userStatus: req.status,
          message: err.message,
        });
      });
  } catch (error) {
    res.status(constants.code.internalServerError).json({
      status: constants.status.statusFalse,
      userStatus: req.status,
      message: error,
    });
  }
};

// const deleteCompany = async (req: any, res: Response, next: NextFunction) => {
//   try {
//     if (!req.body.is_delete) {
//       throw {
//         statusCode: constants.code.preconditionFailed,
//         msg: constants.message.invalidType,
//       };
//     } else {
//       Company.findOneAndUpdate(
//         {
//           _id: new mongoose.Types.ObjectId(req.params.company_id),
//           status: true,
//           isDeleted: false,
//         },
//         {
//           isDeleted: req.body.is_delete,
//         },
//         { new: true }
//       )
//         .then(async (data) => {
//           if (!data) {
//             throw {
//               statusCode: constants.code.dataNotFound,
//               msg: message.companyDleteFailed,
//             };
//           } else {
//             await Address.findOneAndUpdate(
//               {
//                 companyId: new mongoose.Types.ObjectId(data?._id),
//                 status: true,
//                 isDeleted: false,
//               },
//               {
//                 isDeleted: req.body.is_delete,
//               },
//               { new: true }
//             )
//               .then((data) => {
//                 res.status(constants.code.success).json({
//                   status: constants.status.statusTrue,
//                   userStatus: req.status,
//                   message: message.deleteCompanySuccess,
//                 });
//               })
//               .catch((err) => {
//                 res.status(err.statusCode).json({
//                   status: constants.status.statusFalse,
//                   userStatus: req.status,
//                   message: err.msg,
//                 });
//               });
//           }
//         })
//         .catch((err) => {
//           res.status(err.statusCode).json({
//             status: constants.status.statusFalse,
//             userStatus: req.status,
//             message: err.msg,
//           });
//         });
//     }
//   } catch (err: any) {
//     res.status(err.statusCode).json({
//       status: constants.status.statusFalse,
//       userStatus: req.status,
//       message: err.msg,
//     });
//   }
// };

// const deleteAll = async (req: any, res: Response, next: NextFunction) => {
//   try {
//     if (!req.body.is_delete) {
//       throw {
//         statusCode: constants.code.preconditionFailed,
//         msg: constants.message.invalidType,
//       };
//     } else {
//       await Company.updateMany(
//         {
//           isDeleted: false,
//           status: true,
//           isCompanyErp: false,
//         },
//         { isDeleted: true },
//         { new: true }
//       )
//         .then(async (deletedCompany) => {
//           if (!deletedCompany) {
//             throw {
//               statusCode: constants.code.notAcceptable,
//               message: message.companyDleteFailed,
//             };
//           } else {
//             await Company.findOne({
//               isCompanyErp: true,
//               userId: req._id,
//             })
//               .then(async (selfCompany) => {
//                 if (!selfCompany) {
//                   throw {
//                     statusCode: constants.code.notAcceptable,
//                     message: message.selfCompanyNotFound,
//                   };
//                 } else {
//                   await Address.updateMany(
//                     {
//                       companyId: { $ne: selfCompany._id },
//                       status: true,
//                       isDeleted: false,
//                     },
//                     { isDeleted: req.body.is_delete },
//                     { new: true }
//                   )
//                     .then((deletedAllAddress) => {
//                       if (!deletedAllAddress) {
//                         throw {
//                           statusCode: constants.code.notAcceptable,
//                           message: message.addressDeleteFailed,
//                         };
//                       } else {
//                         res.status(constants.code.success).json({
//                           status: constants.status.statusTrue,
//                           userStatus: req.statusCode,
//                           message: message.deleteAllSuccess,
//                         });
//                       }
//                     })
//                     .catch((err) => {
//                       res.status(req.statusCode).json({
//                         statusCode: req.statusCode,
//                         userStatus: req.statusCode,
//                         message: err.message,
//                       });
//                     });
//                 }
//               })
//               .catch((err) => {
//                 res.status(req.statusCode).json({
//                   statusCode: req.statusCode,
//                   userStatus: req.statusCode,
//                   message: err.message,
//                 });
//               });
//           }
//         })
//         .catch((err) => {
//           res.status(req.statusCode).json({
//             statusCode: req.statusCode,
//             userStatus: req.statusCode,
//             message: err.message,
//           });
//         });
//     }
//   } catch (error: any) {
//     res.status(constants.code.internalServerError).json({
//       statusCode: constants.status.statusFalse,
//       userStatus: req.status,
//       message: error.message,
//     });
//   }
// };



const deleteCompany = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      throw {
        statusCode: constants.code.preconditionFailed,
        msg: constants.message.invalidType,
      };
    } else {
      const companyIds:any = [];
      for (let i = 0; i <= req.body.company_ids.length; i++) {
         companyIds.push(new mongoose.Types.ObjectId(req.body.company_ids[i]));
      }
      Company.updateMany(
        {
          _id: { $in: companyIds },
          isDeleted: false,
          status: true,
          isCompanyErp: false,
        },
        {
          isDeleted: req.body.is_delete,
          deletedBy: req.id,
        }
      )
        .then((data) => {
          if (!data) {
            throw {
              statusCode: constants.code.dataNotFound,
              msg: constants.message.dataNotFound,
            };
          } else {
            res.status(constants.code.success).json({
              status: constants.status.statusTrue,
              userStatus: req.status,
              message: message.deleteCompanySuccess,
            });
          }
        })
        .catch((err) => {
          res.status(err.statusCode).json({
            status: constants.status.statusFalse,
            userStatus: req.status,
            message: err.msg,
          });
        });
    }
  } catch (err) {
    res.status(constants.code.internalServerError).json({
      status: constants.status.statusFalse,
      userStatus: req.status,
      message: err,
    });
  }
};

const companyList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;

    let matchAddress = {
      $match: {
            isDeleted: false,
           "addressDetail.constraint": constants.constraint.primary,
      },
    };

    if (Number(req.query.limit) !== 0) {
      Company.aggregate([
        {
          $lookup: {
            from: "addresses",
            localField: "_id",
            foreignField: "companyId",
            as: "addressDetail",
          },
        },
        { $unwind: "$addressDetail" },
        matchAddress,
        // {
        //   $match: {
        //     isDeleted: false,
        //     "addressDetail.constraint": constants.constraint.primary,
        //   },
        // },
        {
          $lookup: {
            from: "cities",
            localField: "addressDetail.address.city",
            foreignField: "_id",
            as: "cityDetail",
          },
        },
        { $unwind: "$cityDetail" },
        {
          $sort: { createdAt: sort },
        },
        {
          $project: {
          
            // contactPersonName:1,
            // slug:1,
            // reference_id:1,
            // companyEmail:1,
            // companyPhone:1,
            // contactEmail:1,
            // contactPhone:1,
            // buyerAndSupplier:1,
            // createdAt:1,
            // gst:1,
            // addressDetail:"$addressDetail",
            // cityDetail:"$cityDetail",
            _id: 1,
            name: 1,
            cityId:"$cityDetail._id",
            createdAt:1,
            buyerAndSupplier:1,
            cityName:"$cityDetail.name"
          },
        },
        {
          $match: {
            $or: [
              {
                buyerAndSupplier: {
                  $regex:  "^" + req.query.filter + ".*",
                  $options: "i",
                },
              },
            ],
          },
        },
        {
          $match: {
            $or: [
              {
                name: {
                  $regex: "^" + req.query.search + ".*",
                  $options: "i",
                },
              },
              {
                "cityDetail.name": {
                  $regex: "^" + req.query.search + ".*",
                  $options: "i",
                },
              }
             
            ],
          },
        },
        {
          $facet: {
            metadata: [
              { $count: "total" },
              { $addFields: { page: Number(page) } },
              {
                $addFields: {
                  totalPages: {
                    $ceil: { $divide: ["$total", limit] },
                  },
                },
              },
              {
                $addFields: {
                  hasPrevPage: {
                    $cond: {
                      if: {
                        $lt: [{ $subtract: [page, Number(1)] }, Number(0)],
                      },
                      then: false,
                      else: true,
                    },
                  },
                },
              },
              {
                $addFields: {
                  prevPage: {
                    $cond: {
                      if: {
                        $lt: [{ $subtract: [page, Number(1)] }, Number(0)],
                      },
                      then: null,
                      else: { $subtract: [page, Number(1)] },
                    },
                  },
                },
              },
              {
                $addFields: {
                  hasNextPage: {
                    $cond: {
                      if: {
                        $gt: [
                          {
                            $subtract: [
                              {
                                $ceil: { $divide: ["$total", limit] },
                              },
                              Number(1),
                            ],
                          },
                          "$page",
                        ],
                      },
                      then: true,
                      else: false,
                    },
                  },
                },
              },
              { $addFields: { nextPage: { $sum: [page, Number(1)] } } },
            ],
            data: [{ $skip: skip }, { $limit: limit }],
          },
        },
      ])
        .then((companyList: any) => {
          if (!companyList) {
            throw {
              statusCode: constants.code.dataNotFound,
              message: constants.message.dataNotFound,
            };
          } else {
            res.status(constants.code.success).json({
              statusCode: constants.status.statusTrue,
              userStatus: req.status,
              message: companyList,
            });
          }
        })
        .catch((err) => {
          res.status(req.statusCode).json({
            statusCode: req.statusCode,
            userStatus: req.statusCode,
            message: "Internal Server Error",
          });
        });
    } else {
      Company.aggregate([
        //{
        //   $match: {
        //     isDeleted: false,
        //     buyerAndSupplier: {
        //       $regex: req.query.search,
        //       $options: "i",
        //     },
        //     name: {
        //       $regex: "^" + req.query.search + ".*",
        //       $options: "i",
        //     },
        //   },
        // },
        {
          $lookup: {
            from: "addresses",
            localField: "_id",
            foreignField: "companyId",
            as: "addressDetail",
          },
        },
        { $unwind: "$addressDetail" },
        matchAddress,
        // {
        //   $match: {
        //     isDeleted: false,
        //     "addressDetail.constraint": constants.constraint.primary,
        //   },
        // },
        {
          $lookup: {
            from: "cities",
            localField: "addressDetail.address.city",
            foreignField: "_id",
            as: "cityDetail",
          },
        },
        { $unwind: "$cityDetail" },
        {
          $sort: { createdAt: sort },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            cityId:"$cityDetail._id",
            cityName:"$cityDetail.name",
            createdAt:1,
            buyerAndSupplier:1,
          },
        },
        {
          $match: {
            $or: [
              {
                buyerAndSupplier: {
                  $regex:  "^" + req.query.filter + ".*",
                  $options: "i",
                },
              },
            ],
          },
        },
        {
          $match: {
            $or: [
              {
                name: {
                  $regex: "^" + req.query.search + ".*",
                  $options: "i",
                },
              },
              {
                "cityDetail.name": {
                  $regex: "^" + req.query.search + ".*",
                  $options: "i",
                },
              }
             
            ],
          },
        },
        {
          $facet: {
            metadata: [
              { $count: "total" },
              { $addFields: { page: Number(page) } },
              {
                $addFields: { totalPages: { $sum: [Number(page), Number(1)] } },
              },
              { $addFields: { hasPrevPage: false } },
              { $addFields: { prevPage: null } },
              { $addFields: { hasNextPage: false } },
              { $addFields: { nextPage: null } },
            ],
            data: [],
          },
        },
      ])
        .then((companyList: any) => {
          if (!companyList) {
            throw {
              statusCode: constants.code.dataNotFound,
              message: constants.message.dataNotFound,
            };
          } else {
            res.status(constants.code.success).json({
              statusCode: constants.status.statusTrue,
              userStatus: req.status,
              message: companyList,
            });
          }
        })
        .catch((err) => {
          res.status(req.statusCode).json({
            statusCode: req.statusCode,
            userStatus: req.statusCode,
            message: "Internal Server Error",
          });
        });
    }
  } catch (error) {
    res.status(constants.code.badRequest).json({
      status: false,
      userStatus: req.statusCode,
      message: error,
    });
  }
};



const changeCompanyLogo = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    Company.findOne({
      _id: new mongoose.Types.ObjectId(req.params.company_id),
      isDeleted: false,
    })
      .then(async (data) => {
        if (!data) {
          throw {
            statusCode: constants.code.dataNotFound,
            msg: constants.message.dataNotFound,
          };
        } else if (!data.logo) {
          Company.findOneAndUpdate(
            {
              _id: new mongoose.Types.ObjectId(req.params.company_id),
              isDeleted: false,
            },
            {
              logo: await logoUrl(req.headers.host, req.file.filename),
            },
            { new: true }
          )
            .then((data) => {
              if (!data) {
                throw {
                  statusCode: constants.code.dataNotFound,
                  msg: constants.message.dataNotFound,
                };
              } else {
                res.status(constants.code.success).json({
                  status: constants.status.statusTrue,
                  userStatus: req.status,
                  message: message.logoChangeSuccess,
                });
              }
            })
            .catch((err) => {
              res.status(err.statusCode).json({
                status: constants.status.statusFalse,
                userStatus: req.status,
                message: err.msg,
              });
            });
        } else {
          await removeLogo(await getFileName(data.logo));
          Company.findOneAndUpdate(
            {
              _id: new mongoose.Types.ObjectId(req.params.company_id),

              isDeleted: false,
            },
            {
              logo: await logoUrl(req.headers.host, req.file.filename),
            },
            { new: true }
          )
            .then((data) => {
              if (!data) {
                throw {
                  statusCode: constants.code.dataNotFound,
                  msg: constants.message.dataNotFound,
                };
              } else {
                res.status(constants.code.success).json({
                  status: constants.status.statusTrue,
                  userStatus: req.status,
                  message: message.logoChangeSuccess,
                });
              }
            })
            .catch((err) => {
              res.status(err.statusCode).json({
                status: constants.status.statusFalse,
                userStatus: req.status,
                message: err.msg,
              });
            });
        }
      })
      .catch((err) => {
        res.status(err.statusCode).json({
          status: constants.status.statusFalse,
          userStatus: req.status,
          message: err.msg,
        });
      });
  } catch (err) {
    res.status(constants.code.internalServerError).json({
      status: constants.status.statusFalse,
      userStatus: req.status,
      message: err,
    });
  }
};

const deleteCompanyLogo = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    Company.findOne({
      _id: new mongoose.Types.ObjectId(req.params.company_id),
      isDeleted: false,
    })
      .then(async (data) => {
        if (!data) {
          throw {
            statusCode: constants.code.dataNotFound,
            msg: constants.message.dataNotFound,
          };
        } else if (!data.logo) {
        } else {
          await removePhoto(await getFileName(data.logo));
          Company.findOneAndUpdate(
            {
              _id: new mongoose.Types.ObjectId(req.params.company_id),

              isDeleted: false,
            },
            {
              profilePicture: await photoUrl(
                req.headers.host,
                req.file.filename
              ),
            },
            { new: true }
          )
            .then((data) => {
              if (!data) {
                throw {
                  statusCode: constants.code.dataNotFound,
                  msg: constants.message.dataNotFound,
                };
              } else {
                res.status(constants.code.success).json({
                  status: constants.status.statusTrue,
                  userStatus: req.status,
                  message: message.logoChangeSuccess,
                });
              }
            })
            .catch((err) => {
              res.status(err.statusCode).json({
                status: constants.status.statusFalse,
                userStatus: req.status,
                message: err.msg,
              });
            });
        }
      })
      .catch((err) => {
        res.status(err.statusCode).json({
          status: constants.status.statusFalse,
          userStatus: req.status,
          message: err.msg,
        });
      });
  } catch (err) {
    res.status(constants.code.internalServerError).json({
      status: constants.status.statusFalse,
      userStatus: req.status,
      message: err,
    });
  }
};

export default {
  addCompanyBulk,
  create,
  detail,
  update,
  deleteCompany,
  companyList,
  changeCompanyLogo,
  deleteCompanyLogo
};
