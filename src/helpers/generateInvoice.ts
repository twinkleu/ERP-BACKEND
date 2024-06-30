import { readFileSync, writeFileSync } from "fs";
import Handlebars from "handlebars";
import puppeteer from "puppeteer";
import { decryptMsg, fileUrl, numberToWord } from "./helper";
import Invoice from "../models/invoice";

const generateHtml = async (invoiceId: string) => {
  const data = await Invoice.aggregate([
    {
      $match: {
        invoiceId,
      },
    },
    {
      $lookup: {
        from: "orders",
        let: {
          orderId: "$orderId",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$orderId", "$$orderId"] },
                  { $eq: ["$isDeleted", false] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              orderId: 1,
              orderDate: {
                $dateToString: {
                  format: "%d/%m/%Y",
                  date: "$orderDate",
                  timezone: "Asia/Kolkata",
                },
              },
            },
          },
        ],
        as: "order_detail",
      },
    },
    {
      $unwind: {
        path: "$order_detail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "companies",
        let: {
          userId: "$sellerId",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", "$$userId"] },
                  { $eq: ["$isDeleted", false] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: "users",
              let: {
                userId: "$userId",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$userId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
              ],
              as: "user_detail",
            },
          },
          { $unwind: "$user_detail" },
          {
            $lookup: {
              from: "pans",
              let: {
                panId: "$user_detail.pan.value",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$panId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
              ],
              as: "pan_detail",
            },
          },
          {
            $unwind: {
              path: "$pan_detail",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "addresses",
              let: {
                addressId: "$addressId",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$addressId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
                {
                  $lookup: {
                    from: "cities",
                    let: {
                      cityId: "$address.city",
                    },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$_id", "$$cityId"] },
                              { $eq: ["$isDeleted", false] },
                            ],
                          },
                        },
                      },
                    ],
                    as: "city_detail",
                  },
                },
                { $unwind: "$city_detail" },
                {
                  $lookup: {
                    from: "states",
                    let: {
                      stateId: "$address.state",
                    },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$_id", "$$stateId"] },
                              { $eq: ["$isDeleted", false] },
                            ],
                          },
                        },
                      },
                    ],
                    as: "state_detail",
                  },
                },
                { $unwind: "$state_detail" },
                {
                  $lookup: {
                    from: "countries",
                    let: {
                      countryId: "$address.country",
                    },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$_id", "$$countryId"] },
                              { $eq: ["$isDeleted", false] },
                            ],
                          },
                        },
                      },
                    ],
                    as: "country_detail",
                  },
                },
                { $unwind: "$country_detail" },
                {
                  $project: {
                    _id: 0,
                    line_one: "$address.line_one",
                    line_two: "$address.line_two",
                    city: "$city_detail.name",
                    state: "$state_detail.name",
                    country: "$country_detail.name",
                    pin_code: "$address.pin_code",
                  },
                },
              ],
              as: "address_detail",
            },
          },
          { $unwind: "$address_detail" },
          {
            $project: {
              _id: 0,
              name: 1,
              gst: "$gst.value",
              userId: "$user_detail._id",
              pan: "$pan_detail.panNumber",
              address: "$address_detail",
            },
          },
        ],
        as: "seller_detail",
      },
    },
    {
      $unwind: {
        path: "$seller_detail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "addresses",
        let: {
          addressId: "$shippingAddress",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$addressId"] },
                  { $eq: ["$isDeleted", false] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: "cities",
              let: {
                cityId: "$address.city",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$cityId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
              ],
              as: "city_detail",
            },
          },
          { $unwind: "$city_detail" },
          {
            $lookup: {
              from: "states",
              let: {
                stateId: "$address.state",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$stateId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
              ],
              as: "state_detail",
            },
          },
          { $unwind: "$state_detail" },
          {
            $lookup: {
              from: "countries",
              let: {
                countryId: "$address.country",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$countryId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
              ],
              as: "country_detail",
            },
          },
          { $unwind: "$country_detail" },
          {
            $project: {
              _id: 0,
              name: 1,
              line_one: "$address.line_one",
              line_two: "$address.line_two",
              city: "$city_detail.name",
              state: "$state_detail.name",
              country: "$country_detail.name",
              pin_code: "$address.pin_code",
            },
          },
        ],
        as: "shippingAddress",
      },
    },
    { $unwind: "$shippingAddress" },
    {
      $lookup: {
        from: "addresses",
        let: {
          addressId: "$billingAddress",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$addressId"] },
                  { $eq: ["$isDeleted", false] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: "cities",
              let: {
                cityId: "$address.city",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$cityId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
              ],
              as: "city_detail",
            },
          },
          { $unwind: "$city_detail" },
          {
            $lookup: {
              from: "states",
              let: {
                stateId: "$address.state",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$stateId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
              ],
              as: "state_detail",
            },
          },
          { $unwind: "$state_detail" },
          {
            $lookup: {
              from: "countries",
              let: {
                countryId: "$address.country",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$countryId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
              ],
              as: "country_detail",
            },
          },
          { $unwind: "$country_detail" },
          {
            $project: {
              _id: 0,
              name: 1,
              line_one: "$address.line_one",
              line_two: "$address.line_two",
              city: "$city_detail.name",
              state: "$state_detail.name",
              country: "$country_detail.name",
              pin_code: "$address.pin_code",
            },
          },
        ],
        as: "billingAddress",
      },
    },
    { $unwind: "$billingAddress" },
    {
      $unwind: "$items",
    },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$isDeleted", false] }],
              },
            },
          },
          {
            $lookup: {
              from: "autoparts",
              let: {
                autopartId: "$autopartId",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$autopartId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
              ],
              as: "autopart_detail",
            },
          },
          {
            $unwind: {
              path: "$autopart_detail",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "hsns",
              let: {
                hsnId: "$HSN",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$hsnId"] },
                        { $eq: ["$isDeleted", false] },
                      ],
                    },
                  },
                },
              ],
              as: "hsn_detail",
            },
          },
          {
            $unwind: {
              path: "$hsn_detail",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              name: "$autopart_detail.name",
              part_number: "$autopart_detail.partNumber",
              hsn: "$hsn_detail.hsn",
            },
          },
        ],
        as: "items.item",
      },
    },
    {
      $unwind: "$items.item",
    },
    {
      $group: {
        _id: "$_id",
        invoiceId: { $first: "$invoiceId" },
        invoiceDate: {
          $first: {
            $dateToString: {
              format: "%d/%m/%Y",
              date: "$invoiceDate",
              timezone: "Asia/Kolkata",
            },
          },
        },
        shippingAddress: { $first: "$shippingAddress" },
        billingAddress: { $first: "$billingAddress" },
        order_detail: { $first: "$order_detail" },
        seller_detail: { $first: "$seller_detail" },
        place_of_supply: { $first: "$seller_detail.address.state" },
        place_of_delivery: { $first: "$shippingAddress.state" },
        items: {
          $push: {
            _id: "$items.item._id",
            name: "$items.item.name",
            part_number: "$items.item.part_number",
            hsn: "$items.item.hsn",
            mrp: "$items.mrp",
            sellingPrice: "$items.sellingPrice",
            quantity: "$items.quantity",
            gst: "$items.gst",
            total: "$items.total",
            subTotal: "$items.subTotal",
            discount: "$items.discount",
            discountPercent: "$items.discountPercent",
            taxableAmount: "$items.taxableAmount",
            taxAmount: "$items.taxAmount",
            netAmount: "$items.netAmount",
          },
        },
        itemsTwo: {
          $push: {
            _id: "$items.item._id",
            name: "$items.item.name",
            part_number: "$items.item.part_number",
            hsn: "$items.item.hsn",
            mrp: "$items.mrp",
            sellingPrice: "$items.sellingPrice",
            quantity: "$items.quantity",
            gst: "$items.gst",
            halfGST: { $divide: ["$items.gst", 2] },
            total: "$items.total",
            subTotal: "$items.subTotal",
            discount: "$items.discount",
            discountPercent: "$items.discountPercent",
            taxableAmount: "$items.taxableAmount",
            taxAmount: "$items.taxAmount",
            halfTaxAmount: { $divide: ["$items.taxAmount", 2] },
            netAmount: "$items.netAmount",
          },
        },
        total: { $first: "$total" },
        subTotal: { $first: "$subTotal" },
        discount: { $first: "$discount" },
        taxableAmount: { $first: "$taxableAmount" },
        taxAmount: { $first: "$taxAmount" },
      },
    },
    {
      $addFields: {
        taxBreakUp: {
          $cond: {
            if: { $eq: ["$place_of_supply", "$place_of_delivery"] },
            then: {
              intraState: true,
              items: "$itemsTwo",
              taxableAmount: "$taxableAmount",
              taxAmount: "$taxAmount",
              halfTaxAmount: { $divide: ["$taxAmount", 2] },
            },
            else: {
              interState: true,
              items: "$items",
              taxableAmount: "$taxableAmount",
              taxAmount: "$taxAmount",
            },
          },
        },
      },
    },
  ]);

  const context = {
    data: data[0],
    pan: await decryptMsg(
      data[0].seller_detail.pan,
      data[0].seller_detail.userId.toString()
    ),
    gst: await decryptMsg(
      data[0].seller_detail.gst,
      data[0].seller_detail.userId.toString()
    ),
    amountInWords: (await numberToWord(Number(data[0].subTotal))).toUpperCase(),
  };

  const content = readFileSync("public/templates/invoice.html", "utf8");

  const template = Handlebars.compile(content);

  Handlebars.registerHelper("inc", function (value, options) {
    return parseInt(value) + 1;
  });

  return template(context);
};

const createInvoice = async (host: string, invoiceId: string) => {
  const html: any = await generateHtml(invoiceId);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.emulateMediaType("screen");
  const file = await page.pdf({ printBackground: true, format: "A4" });
  await browser.close();

  const filename = `invoice-${Date.now()}.pdf`;
  writeFileSync(`public/files/${filename}`, file, "base64");

  return fileUrl(host, filename);
};

export default createInvoice;
