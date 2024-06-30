import { Request, Response, NextFunction } from "express";
import constants from "../../utils/constants";
import message from "./inventoryConstant";
import User from "../../models/user";
import mongoose from "mongoose";
import Product from "../../models/product";
import Address from "../../models/address";
import Inventory from "../../models/inventory";
import Company from "../../models/company";
import InventoryHistory from "../../models/inventoryHistory";
import { generateDocumentNumber } from "../../helpers/helper";
import sendMail from "../../helpers/mail";

const inventoryList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;

    const companyData: any = await Company.findOne({
      isCompanyErp: true,
      isDeleted: false,
    });
    let createdBy = companyData._id;

    if (Number(req.query.limit) !== 0) {
      Product.aggregate([
        {
          $match: {
            soldBy: new mongoose.Types.ObjectId(createdBy),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "inventories",
            foreignField: "productId",
            localField: "_id",
            as: "inventory_detail",
          },
        },
        {
          $unwind: {
            path: "$inventory_detail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            quantity: { $sum: "$inventory_detail.quantity" },
            sold: { $sum: "$inventory_detail.sold" },
            createdAt: { $first: { $toLong: "$createdAt" } },
            productName: { $first: "$name" },
            sku: { $first: "$sku" },
            msl: { $first: { $ifNull: ["$inventory_detail.msl", 0] } },
          },
        },
        {
          $match: {
            $or: [
              {
                productName: {
                  $regex: "^" + req.query.search + ".*",
                  $options: "i",
                },
              },
              {
                productNumber: {
                  $regex: "^" + req.query.search + ".*",
                  $options: "i",
                },
              },
            ],
          },
        },
        {
          $sort: { createdAt: sort },
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
        .then((data) => {
          if (!data[0].data.length) {
            throw {
              statusCode: constants.code.dataNotFound,
              msg: constants.message.dataNotFound,
            };
          } else {
            res.status(constants.code.success).json({
              status: constants.status.statusTrue,
              userStatus: req.status,
              message: message.productListSuccess,
              metadata: data[0].metadata,
              data: data[0].data,
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
      Product.aggregate([
        {
          $match: {
            soldBy: new mongoose.Types.ObjectId(createdBy),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "inventories",
            foreignField: "productId",
            localField: "_id",
            as: "inventory_detail",
          },
        },
        {
          $unwind: {
            path: "$inventory_detail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            quantity: { $sum: "$inventory_detail.quantity" },
            sold: { $sum: "$inventory_detail.sold" },
            createdAt: { $first: { $toLong: "$createdAt" } },
            productName: { $first: "$name" },
            sku: { $first: "$sku" },
            msl: { $first: { $ifNull: ["$inventory_detail.msl", 0] } },
          },
        },
        {
          $match: {
            $or: [
              {
                productName: {
                  $regex: "^" + req.query.search + ".*",
                  $options: "i",
                },
              },
              {
                productNumber: {
                  $regex: "^" + req.query.search + ".*",
                  $options: "i",
                },
              },
            ],
          },
        },
        {
          $sort: { createdAt: sort },
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
        .then((data) => {
          if (!data[0].data.length) {
            throw {
              statusCode: constants.code.dataNotFound,
              msg: constants.message.dataNotFound,
            };
          } else {
            res.status(constants.code.success).json({
              status: constants.status.statusTrue,
              userStatus: req.status,
              message: constants.message.success,
              metadata: data[0].metadata,
              data: data[0].data,
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

const detail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyData: any = await Company.findOne({
      isCompanyErp: true,
      isDeleted: false,
    });
    let createdBy = companyData._id;

    Product.findOne({
      _id: new mongoose.Types.ObjectId(req.params.product_id),
      //status: true,
      soldBy: new mongoose.Types.ObjectId(createdBy),
      isDeleted: false,
    })
      .then(async (data: any) => {
        if (!data) {
          throw {
            statusCode: constants.code.dataNotFound,
            msg: constants.message.dataNotFound,
          };
        } else {
          Product.aggregate([
            {
              $match: {
                _id: new mongoose.Types.ObjectId(req.params.product_id),
                soldBy: new mongoose.Types.ObjectId(createdBy),
                isDeleted: false,
                //status:true
              },
            },
            {
              $lookup: {
                from: "comments",
                let: { productID: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$productId", "$$productID"] },
                      isDeleted: false,
                    },
                  },
                  {
                    $unwind: "$comments",
                  },
                  {
                    $lookup: {
                      from: "users",
                      let: { userID: "$comments.createdBy" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$_id", "$$userID"] },
                          },
                        },
                        {
                          $project: { _id: 1, fname: 1, lname: 1 },
                        },
                      ],
                      as: "commentUser",
                    },
                  },
                  {
                    $unwind: {
                      path: "$commentUser",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $group: {
                      _id: "$_id",
                      comments: {
                        $push: {
                          _id: "$comments._id",
                          comment: "$comments.comment",
                          fname: "$commentUser.fname",
                          lname: "$commentUser.lname",
                          createdAt: "$comments.createdAt",
                          isDeleted: "$comments.isDeleted",
                        },
                      },
                    },
                  },
                ],
                as: "commentsDetail",
              },
            },
            {
              $unwind: {
                path: "$commentsDetail",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "brands",
                let: { brandID: "$brandId" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$brandID"] },
                      isDeleted: false,
                    },
                  },
                ],
                as: "brandDetail",
              },
            },
            {
              $unwind: {
                path: "$brandDetail",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "categories",
                let: { categoryID: "$categoryId" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$categoryID"] },
                      isDeleted: false,
                    },
                  },
                ],
                as: "categoryDetail",
              },
            },
            {
              $unwind: {
                path: "$categoryDetail",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "subcategories",
                let: { subcategoryID: "$subCategoryId" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$subcategoryID"] },
                      isDeleted: false,
                    },
                  },
                ],
                as: "subcategoryDetail",
              },
            },
            {
              $unwind: {
                path: "$subcategoryDetail",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "subchildcategories",
                let: { subchildcategoryID: "$subChildCategoryId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$_id", "$$subchildcategoryID"],
                      },
                      isDeleted: false,
                    },
                  },
                ],
                as: "subchildcategoryDetail",
              },
            },
            {
              $unwind: {
                path: "$subchildcategoryDetail",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "colors",
                let: { colorID: "$colorId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$_id", "$$colorID"],
                      },
                      isDeleted: false,
                    },
                  },
                ],
                as: "colorDetail",
              },
            },
            {
              $unwind: {
                path: "$colorDetail",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "painttypes",

                let: { paintTypeID: "$paintType" },

                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$paintTypeID"] },
                      isDeleted: false,
                    },
                  },
                ],

                as: "paintTypeDetail",
              },
            },

            {
              $unwind: {
                path: "$paintTypeDetail",

                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "finishtypes",

                let: { finishTypeID: "$finish" },

                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$finishTypeID"] },
                      isDeleted: false,
                    },
                  },
                ],

                as: "finishTypeDetail",
              },
            },

            {
              $unwind: {
                path: "$finishTypeDetail",

                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "uoms",

                let: { uomID: "$weight.unit" },

                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$uomID"] },
                      isDeleted: false,
                    },
                  },
                ],

                as: "uomDetail",
              },
            },

            {
              $unwind: {
                path: "$uomDetail",

                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "base_paint_one.productId",
                foreignField: "_id",
                as: "basePaintOneDetail",
              },
            },
            {
              $unwind: {
                path: "$basePaintOneDetail",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "uoms",

                localField: "base_paint_one.weight.unit",

                foreignField: "_id",

                as: "uombasePaintOneDetail",
              },
            },

            {
              $unwind: {
                path: "$uombasePaintOneDetail",

                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "products",
                localField: "base_paint_two.productId",
                foreignField: "_id",
                as: "basePaintTwoDetail",
              },
            },
            {
              $unwind: {
                path: "$basePaintTwoDetail",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "uoms",

                localField: "base_paint_two.weight.unit",

                foreignField: "_id",

                as: "uombasePaintTwoDetail",
              },
            },

            {
              $unwind: {
                path: "$uombasePaintTwoDetail",

                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "tinters.productId",
                foreignField: "_id",
                as: "tintersDetail",
              },
            },
            {
              $lookup: {
                from: "uoms",
                localField: "tinters.weight.unit",
                foreignField: "_id",
                as: "uomTintersDetail",
              },
            },

            {
              $lookup: {
                from: "hsns",
                foreignField: "_id",
                localField: "HSN",
                as: "hsn_detail",
              },
            },
            { $unwind: "$hsn_detail" },
            {
              $lookup: {
                from: "inventories",
                let: {
                  productId: "$_id",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$productId", "$$productId"] },
                          { $eq: ["$isDeleted", false] },
                        ],
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: "addresses",
                      foreignField: "_id",
                      localField: "locationId",
                      as: "address_detail",
                    },
                  },
                ],
                as: "inventory_detail",
              },
            },
            {
              $project: {
                _id: 0,
                Type: 1,
                product_id: "$_id",
                basic_details: {
                  name: "$name",
                  brand: "$brandDetail.name",
                  color: "$colorDetail.name",
                  sku: "$sku",
                  category: "$categoryDetail.name",
                  pack_size: "$weight.value",
                  uomID: "$uomDetail._id",
                  uom: "$uomDetail.uom_type",
                },
                other_details: {
                  paintTypeID: "$paintTypeDetail._id",
                  paintType: "$paintTypeDetail.paint_type",
                  finishTypeID: "$finishTypeDetail._id",
                  finishType: "$finishTypeDetail.finish_type",
                  subcategory: "$subcategoryDetail.name",
                  subchildategory: "$subchildcategoryDetail.name",
                  description: "$description",
                },
                paint_formula: {
                  base_paint_one: {
                    name: "$basePaintOneDetail.name",
                    _id: "$basePaintOneDetail._id",
                    pack_size: {
                      uomId: "$uombasePaintOneDetail._id",
                      uomType: "$uombasePaintOneDetail.uom_type",
                      value: "$base_paint_one.weight.value",
                    },
                  },
                  base_paint_two: {
                    name: "$basePaintTwoDetail.name",
                    _id: "$basePaintTwoDetail._id",
                    pack_size: {
                      uomId: "$uombasePaintTwoDetail._id",
                      uomType: "$uombasePaintTwoDetail.uom_type",
                      value: "$base_paint_two.weight.value",
                    },
                  },
                  tinters: {
                    $map: {
                      input: "$tinters",
                      as: "tinter",
                      in: {
                        _id: "$$tinter._id",
                        name: { $arrayElemAt: ["$tintersDetail.name", 0] },
                        pack_size: {
                          uom_type: {
                            $arrayElemAt: ["$uomTintersDetail.uom_type", 0],
                          },
                          uomId: { $arrayElemAt: ["$uomTintersDetail._id", 0] },
                          weight: "$$tinter.weight.value",
                        },
                        productId: "$$tinter.productId",
                      },
                    },
                  },
                },
                price_details: {
                  mrp: "$mrp",
                  sellingPrice: "$sellingPrice",
                  costPrice: "$costPrice",
                  unitPrice: "$unitPrice",
                  sold: "$sold",
                  currency: "$currency",
                },
                commentsDetail: "$commentsDetail.comments",
                QuantityToProduce: 1,
                inventory_detail: {
                  $map: {
                    input: "$inventory_detail",
                    as: "inventory",
                    in: {
                      inventoryId: "$$inventory._id",
                      inventory_name: {
                        $arrayElemAt: ["$$inventory.address_detail.slug", 0],
                      },
                      address_id: {
                        $arrayElemAt: ["$$inventory.address_detail._id", 0],
                      },
                      product_id: "$$inventory.productId",
                      msl: "$$inventory.msl",
                      quantity: "$$inventory.quantity",
                    },
                  },
                },
                uom: "$weight.unit",
              },
            },
          ])
            .then((productData) => {
              if (!productData.length) {
                throw {
                  statusCode: constants.code.dataNotFound,
                  message: message.noProductFound,
                };
              } else {
                res.status(constants.code.success).json({
                  status: constants.status.statusTrue,
                  userStatus: req.status,
                  data: productData[0],
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

const manageInventory = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyData: any = await Company.findOne({
      isCompanyErp: true,
      isDeleted: false,
    });
    if (!companyData) {
      throw {
        statusCode: constants.code.dataNotFound,
        message: message.companyNotFound,
      };
    }
    let createdBy = companyData._id;

    Product.findOne({
      _id: new mongoose.Types.ObjectId(req.body.product_id),
      soldBy: new mongoose.Types.ObjectId(createdBy),
      isDeleted: false,
    })
      .then((product_detail) => {
        if (!product_detail) {
          throw {
            statusCode: constants.code.dataNotFound,
            msg: constants.message.dataNotFound,
          };
        } else {
       
          Address.findOne({
            _id: new mongoose.Types.ObjectId(req.body.location_id),
            companyId: new mongoose.Types.ObjectId(companyData._id),
            isDeleted: false,
          })
            .then(async (address_detail) => {
              if (!address_detail) {
                throw {
                  statusCode: constants.code.dataNotFound,
                  msg: constants.message.addressNotLinked,
                };
              } else {
                const user_detail: any = await User.findOne({
                  role: constants.accountLevel.superAdmin,
                  isDeleted: false,
                });

                if (!user_detail) {
                  throw {
                    statusCode: constants.code.dataNotFound,
                    message: constants.message.invalidUser,
                  };
                }
                if (req.body.quantity <= req.body.msl) {
                  const payload = {
                    //to: ['sanghee2343@gmail.com'],
                    to: [
                      `${companyData.companyEmail.value}`,
                      `${user_detail.email.value}`,
                    ],
                    title: constants.emailTitle.reachedMsl,
                    body: message.mslReached,
                    data: {
                      companyName: "company_detail?.name,",
                      email: "company_detail?.companyEmail?.value,",
                      data: `${product_detail.name},`,
                    },
                  };
                  await sendMail(payload);
                }
                const oldInventoryData: any = await Inventory.findOne({
                  company_Id: new mongoose.Types.ObjectId(companyData._id),
                  productId: new mongoose.Types.ObjectId(product_detail._id),
                  locationId: new mongoose.Types.ObjectId(address_detail._id),
                  isDeleted: false,
                });

                let newQuantity = 0;
                if (oldInventoryData) {
                  newQuantity = Number(oldInventoryData.quantity);
                if (Number(req.body?.amountToAdd)>0) {
                  newQuantity += Number(req.body.amountToAdd);
                } else if (Number(req.body?.quantityToReduce)>0) {
                  if (Number(req.body.quantityToReduce) > oldInventoryData.quantity) {
                          throw {
                            statusCode: constants.code.badRequest,
                            msg: message.insufficientQuantity,
                          };
                        }
                        else{
                          newQuantity -= Number(req.body.quantityToReduce);
                        }
                }
                }
                else{
                  if(Number(req.body?.quantityToReduce)>0){
                    throw {
                      statusCode: constants.code.badRequest,
                      msg: message.insufficientQuantity,
                    };
                  }
                  else{
                    newQuantity = Number(req.body.amountToAdd);
                  }
                }
                Inventory.findOneAndUpdate(
                  {
                    company_Id: new mongoose.Types.ObjectId(companyData._id),
                    productId: new mongoose.Types.ObjectId(product_detail._id),
                    locationId: new mongoose.Types.ObjectId(address_detail._id),
                    isDeleted: false,
                  },
                  {
                    company_Id: new mongoose.Types.ObjectId(companyData._id),
                    productId: new mongoose.Types.ObjectId(product_detail._id),
                    locationId: new mongoose.Types.ObjectId(address_detail._id),
                    // quantity: oldInventoryData && req.body?.amountToAdd
                    //   ? Number(oldInventoryData?.quantity) +
                    //     Number(req.body.quantity)
                    //   : Number(req.body.quantity),
                    quantity: newQuantity,
                    updatedBy: req.id,
                    msl: req.body.msl,
                    createdBy: req.id,
                  },
                  {
                    new: true,
                    upsert: true,
                  }
                )
                  .then(async (inventoryData: any) => {
                    if (!inventoryData) {
                      throw {
                        statusCode: constants.code.internalServerError,
                        msg: constants.message.internalServerError,
                      };
                    } else {
                      InventoryHistory.create({
                        transaction_id: await generateDocumentNumber(),
                        type: constants.historyType.Inventory,
                        product: [
                          {
                            product_id: product_detail._id,
                            quantity: {
                              previous: oldInventoryData?.quantity
                                ? oldInventoryData?.quantity
                                : 0,
                              changed:
                                inventoryData.quantity -
                                (oldInventoryData?.quantity
                                  ? oldInventoryData?.quantity
                                  : 0),
                              new: inventoryData.quantity,
                            },
                            msl: {
                              previous: oldInventoryData
                                ? Number(oldInventoryData?.msl)
                                : 0,
                              changed:
                                inventoryData.msl -
                                (oldInventoryData
                                  ? Number(oldInventoryData?.msl)
                                  : 0),
                              new: inventoryData.msl,
                            },
                            price: product_detail.sellingPrice,
                          },
                        ],
                        sourceLocation: inventoryData.locationId,
                        isDeleted: false,
                        createdBy: req.id,
                      })
                        .then((inventoryHistory_data: any) => {
                          if (!inventoryHistory_data) {
                            throw {
                              statusCode: constants.code.internalServerError,
                              msg: message.inventoryHistory_failed,
                            };
                          } else {
                            res.status(constants.code.success).json({
                              status: constants.status.statusTrue,
                              userStatus: req.status,
                              message: message.inventorySuccess,
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
        //product_detail catch error block
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

const inventoryHistorylist = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;0

    let createdBy = req.id;
    if (
      req.role === constants.accountLevel.admin ||
      req.role === constants.accountLevel.manager ||
      req.role === constants.accountLevel.inventorymanager
    ) {
      const userDetail = await User.findById({
        _id: new mongoose.Types.ObjectId(req.id),
        role:{
          $or:[
            constants.accountLevel.inventorymanager,
            constants.accountLevel.admin,
            constants.accountLevel.manager
          ]
        }
      });
      createdBy = userDetail?.createdBy;
    }

    if (Number(req.query.limit) !== 0) {
      InventoryHistory.aggregate([
        {
          $match: {
            "product.product_id": new mongoose.Types.ObjectId(
              req.body.product_id
            ),
            type: constants.historyType.Inventory,
            isDeleted: false,
          },
        },
        {
          $unwind: {
            path: "$product",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "product.product_id",
            foreignField: "_id",
            as: "product_detail",
          },
        },
        {
          $unwind: {
            path: "$product_detail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "user_detail",
          },
        },
        {
          $unwind: {
            path: "$user_detail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { createdAt: sort },
        },
        {
          $project: {
            _id: 1,
            product_id: "$product_detail._id",
            product_name: "$product_detail.name",
            createdBy_fname: "$user_detail.fname",
            createdBy_lname: "$user_detail.lname",
            createdAt: "$createdAt",
            quantity: {
              previous: "$product.quantity.previous",
              changed: "$product.quantity.changed",
              new: "$product.quantity.new",
            },
            msl: {
              previous: "$product.msl.previous",
              changed: "$product.msl.changed",
              new: "$product.msl.new",
            },
            price: "$product.price",
            currency: "$product.currency",
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
        .then((data) => {
          // if (!data[0].data.length) {
          //   throw {
          //     statusCode: constants.code.dataNotFound,
          //     msg: constants.message.dataNotFound,
          //   };
          // }
          //  else {
          res.status(constants.code.success).json({
            status: constants.status.statusTrue,
            userStatus: req.status,
            message: message.inventoryHistoryListSuccess,
            metadata: data[0].metadata,
            data: data[0].data,
          });
          //  }
        })
        .catch((err) => {
          res.status(err.statusCode).json({
            status: constants.status.statusFalse,
            userStatus: req.status,
            message: err.msg,
          });
        });
    } else {
      InventoryHistory.aggregate([
        {
          $match: {
            "product.product_id": new mongoose.Types.ObjectId(
              req.body.product_id
            ),
            type: constants.historyType.Inventory,
            isDeleted: false,
          },
        },
        {
          $unwind: {
            path: "$product",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "product.product_id",
            foreignField: "_id",
            as: "product_detail",
          },
        },
        {
          $unwind: {
            path: "$product_detail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "user_detail",
          },
        },
        {
          $unwind: {
            path: "$user_detail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { createdAt: sort },
        },
        {
          $project: {
            _id: 1,
            product_id: "$product_detail._id",
            product_name: "$product_detail.name",
            createdBy_fname: "$user_detail.fname",
            createdBy_lname: "$user_detail.lname",
            createdAt: "$createdAt",
            quantity: {
              previous: "$product.quantity.previous",
              changed: "$product.quantity.changed",
              new: "$product.quantity.new",
            },
            msl: {
              previous: "$product.msl.previous",
              changed: "$product.msl.changed",
              new: "$product.msl.new",
            },
            price: "$product.price",
            currency: "$product.currency",
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
        .then((data) => {
          //   if (!data[0].data.length) {
          //   throw {
          //     statusCode: constants.code.dataNotFound,
          //     msg: constants.message.dataNotFound,
          //   };
          // } else {
          res.status(constants.code.success).json({
            status: constants.status.statusTrue,
            userStatus: req.status,
            message: message?.inventoryHistoryListSuccess,
            metadata: data[0]?.metadata,
            data: data[0]?.data,
          });
          // }
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


export default {
  inventoryList,
  detail,
  manageInventory,
  inventoryHistorylist,
};

