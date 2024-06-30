import { hashSync, compareSync } from "bcrypt";
import CryptoJS from "crypto-js";
import { decode } from "jsonwebtoken";
import User from "../models/user";
import Location from "../models/location";
import Address from "../models/address";
import constants from "../utils/constants";
import { unlinkSync } from "fs";
const ipInfo = require("ip-info-finder");
import crypto from "crypto";
// import Request from "../models/request";
import mongoose from "mongoose";
import Request from "../models/request";

const getMessage = async (msg: any) => {
  const errMsg: any = Object.values(msg.errors)[0];
  return errMsg[0];
};

const unixTime = async (date: any) => {
  return new Date(date).getTime();
};

const validateRequestData = async (validationRule: any, data: any) => {
  const entries1 = Object.entries(validationRule);
  const entries2 = Object.entries(data);

  if (entries1.length < entries2.length) {
    return false;
  }

  for (const [key, value] of entries2) {
    if (!validationRule.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
};

const randomNumber = async () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num;
};

const createSlug = async (title: string) => {
  let slug = title.toLowerCase();
  slug = slug.replace(/[^a-z0-9\-_\s]/g, ""); // Remove non-alphanumeric characters
  slug = slug.replace(/\s+/g, "-"); // Replace spaces with hyphens
  slug = slug.replace(/[-_]+/g, "-"); // Remove  hyphens and underscores
  slug = slug.replace(/^-+|-+$/g, ""); //  Remove leading and trailing hyphens and underscores
  return slug;
};

const toLowerCase = async (text: string) => {
  return text.toLowerCase();
};

const minutes = async (time: any) => {
  const prevTime = new Date(time).getTime();
  const curnTime = new Date().getTime();
  const minutes = Math.round((curnTime - prevTime) / 1000 / 60);
  return minutes;
};

const getUsername = async (email: string) => {
  const username = `${email.split("@")[0]}${Math.floor(
    10 + Math.random() * 90
  )}`;

  return await User.findOne({
    username: username,
  })
    .then(async (data) => {
      if (data) {
        getUsername(email);
      } else {
        return username;
      }
    })
    .catch((err: any) => {
      console.log(err);
    });
};

const hashPassword = async (password: string) => {
  const saltRounds = 15;
  return hashSync(password, saltRounds);
};

const checkPassword = async (password: string, hash: string) => {
  return compareSync(password, hash);
};

function phoneFormat(phone: any) {
  if (String(phone)?.startsWith("+91")) {
    return phone;
  } else {
    return `+91${phone}`;
  }
}

const getPinDetail = async (pinCode: string) => {
  return await Location.aggregate([
    { $match: { pinCode: pinCode } },
    {
      $lookup: {
        from: "cities",
        foreignField: "_id",
        localField: "cityId",
        as: "cityDetail",
      },
    },
    { $unwind: "$cityDetail" },
    {
      $lookup: {
        from: "states",
        foreignField: "_id",
        localField: "cityDetail.stateId",
        as: "stateDetail",
      },
    },
    { $unwind: "$stateDetail" },
    {
      $lookup: {
        from: "countries",
        foreignField: "_id",
        localField: "stateDetail.countryId",
        as: "countryDetail",
      },
    },
    { $unwind: "$countryDetail" },
    {
      $project: {
        _id: 1,
        name: 1,
        pinCode: 1,
        cityId: "$cityDetail._id",
        cityName: "$cityDetail.name",
        stateId: "$stateDetail._id",
        stateName: "$stateDetail.name",
        countryId: "$countryDetail._id",
        countryName: "$countryDetail.name",
      },
    },
  ])
    .then((data: any) => {
      if (data) {
        return data[0];
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const generateAddressSlug = async (
  name: string,
  address_type: string,
  pin_code: string
) => {
  const slug: string = `${name.split(" ")[0]
    }-${address_type}-${pin_code}-${Math.floor(1000 + Math.random() * 9000)}`;

  return await Address.findOne({
    slug: slug.toLowerCase(),
  })
    .then(async (data) => {
      if (data) {
        generateAddressSlug(name, address_type, pin_code);
      } else {
        return slug.toLowerCase();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const randomKey = async () => {
  const str = Array.from({ length: 64 }, () =>
    "0123456789abcdef".charAt(Math.floor(Math.random() * 16))
  ).join("");
  const key = CryptoJS.enc.Hex.parse(str);
  return key;
};

const randomiv = async () => {
  const str = Array.from({ length: 32 }, () =>
    "0123456789abcdef".charAt(Math.floor(Math.random() * 16))
  ).join("");
  const iv = CryptoJS.enc.Hex.parse(str);
  return iv;
};

const randomToken = async () => {
  const str = Array.from({ length: 48 }, () =>
    "0123456789aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ".charAt(
      Math.floor(Math.random() * 62)
    )
  ).join("");

  return str;
};

const jwtDecode = async (token: string) => {
  return decode(token);
};

const getFileName = async (fileUrl: string) => {
  let index = fileUrl.lastIndexOf("/") + 1;
  let filename = fileUrl.substring(index);
  return filename;
};

const fileUrl = async (host: any, filename: string) => {
  if (process.env.NODE_ENV === "dev") {
    return `http://${host}/files/${filename}`;
  } else {
    return `https://${host}/files/${filename}`;
  }
};

const photoUrl = async (host: string, filename: string) => {
  if (process.env.NODE_ENV === "dev") {
    return `http://${host}/photos/${filename}`;
  } else {
    return `https://${host}/photos/${filename}`;
  }
};
const logoUrl = async (host: string, filename: string) => {
  if (process.env.NODE_ENV === "dev") {
    return `http://${host}/logos/${filename}`;
  } else {
    return `https://${host}/logos/${filename}`;
  }
};

const imageUrl = async (host: string, filename: string) => {
  if (process.env.NODE_ENV === "dev") {
    return `http://${host}/images/${filename}`;
  } else {
    return `https://${host}/images/${filename}`;
  }
};

const removeFile = async (filename: string) => {
  return unlinkSync(`public/files/${filename}`);
};

const removePhoto = async (filename: string) => {
  return unlinkSync(`public/photos/${filename}`);
};

const removeLogo = async (filename: string) => {
  return unlinkSync(`public/logos/${filename}`);
};

const removeImage = async (filename: any) => {
  return unlinkSync(`public/images/${filename}`);
};

const createPassword = async (name: any, dob: any) => {
  const newName = name.charAt(0).toUpperCase() + name.slice(1);
  const date = new Date(dob);
  const year = date.getFullYear();
  return `${newName}@${year}`;
};

const isDateValid = async (date: any) => {
  const newDate: any = new Date(date);
  return !isNaN(newDate);
};

const encryptMsg = async (msg: string, key: any) => {
  const encrypted = CryptoJS.AES.encrypt(msg, key);
  return encrypted.toString();
};

const decryptMsg = async (msg: string, key: any) => {
  const decrypted = CryptoJS.AES.decrypt(msg, key);
  return decrypted.toString(CryptoJS.enc.Utf8);
};

const encryptObj = async (msg: any, key: any) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(msg), key);
    return encrypted.toString();
  } catch (err) {
    return false;
  }
};

const decryptObj = async (msg: any, key: any) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(msg, key);
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  } catch (err) {
    return false;
  }
};

const timeString = async () => {
  return Date.now().toString();
};

const createBufferObject = async (msg: any) => {
  return Buffer.from(msg).toString("base64");
};

const hashMessage = async (msg: string, key: string) => {
  return crypto.createHmac("SHA256", msg).update(key).digest();
};

const objectToQS = async (data: any) => {
  return new URLSearchParams(data).toString();
};


const generateSku = async (brand: any, name: string, category: any, weight: any, color: any) => {
  let brandSku: any = brand.substring(0, 1).toUpperCase()
  let categorySku: any = '';
  let nameSku: any = ''
  let colorSku: any = ''
  //generating SKU for thinners
  if (category?.slug === 'thinner') {
    categorySku = 'TH';
    const getThinnerNmbrRegex = /\d{1,3}$/;
    const match = name.match(getThinnerNmbrRegex);
    if (match) {
      nameSku = match;
    }
    else {
      const splittedname = name.split(' ')
      if (splittedname.length > 1) {
        nameSku = splittedname[0].substring(0, 1) + splittedname[1].substring(0, 1);
      }
      else {
        nameSku = splittedname[0].substring(splittedname[0].length - 1) + splittedname[0].substring(splittedname[0].length - 1)
      }
    }
    const thinnersku = brandSku + categorySku + nameSku + '/' + weight;
    return thinnersku.toLowerCase();
  }
  else {
    //generating SKU for other type of products , when color selected is from RAL Design then we provide color name in SKU
    if (color) {
      if (color.type === constants.colorType.design) {
        let splittedColor = color.name
        //if color name has 2 words
        if (splittedColor.length > 1) {
          const regex2 = /\b\w/g;
          colorSku = color.name.match(regex2).join('');
        }
        else {
          //if color sku has single word

          // splittedColor = splittedColor[0].substring(0, 1) + splittedColor[0].substring(0, 1)
          const regex2 = /^.|.$/g;
          colorSku = color.name.match(regex2).join("");
        }
      }
      else {
        //generating SKU for other type of products , when color selected is from RAL Classic and RAL Effect, then we provide RAL Code  in SKU
        colorSku = color.ral_code.slice(3);
      }
    }
    //if name contains a number, it should be added to SKU
    const numberedRegx = /\d{1,3}$/;
    const match = name.match(numberedRegx)?.join('')
    const splittedname = name.split(' ')
    //if name containts more than on word, then first letter of each word should be taken
    if (splittedname.length > 1) {
      for (let i = 0; i < splittedname.length; i++) {
        nameSku += splittedname[i].substring(0, 1)
        if (match && i === splittedname.length - 1) {
          nameSku += match
        }
      }
    }
    //if name containts only single word, then first and last character of the name name should be taken
    else {
      let namedRegx = /^.|.$/g
      nameSku = name.match(namedRegx)?.join('')
    }

    categorySku = category.name.slice(0, 2);
    const productSku = brandSku + categorySku + colorSku + nameSku + '/' + weight
    return productSku.toUpperCase()
  }

}

const numberToWord = async (number: any) => {
  const converter = (n: any) => {
    let string = n.toString(),
      units,
      tens,
      scales,
      start,
      end,
      chunks,
      chunksLen,
      chunk,
      ints,
      i,
      word,
      words;

    /* Is number zero? */
    if (parseInt(string) === 0) {
      return "zero";
    }

    /* Array of units as words */
    units = [
      "",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];

    /* Array of tens as words */
    tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];

    /* Array of scales as words */
    scales = [
      "",
      "thousand",
      "million",
      "billion",
      "trillion",
      "quadrillion",
      "quintillion",
      "sextillion",
      "septillion",
      "octillion",
      "nonillion",
      "decillion",
      "undecillion",
      "duodecillion",
      "tredecillion",
      "quatttuor-decillion",
      "quindecillion",
      "sexdecillion",
      "septen-decillion",
      "octodecillion",
      "novemdecillion",
      "vigintillion",
      "centillion",
    ];

    /* Split user arguemnt into 3 digit chunks from right to left */
    start = string.length;
    chunks = [];
    while (start > 0) {
      end = start;
      chunks.push(string.slice((start = Math.max(0, start - 3)), end));
    }

    /* Check if function has enough scale words to be able to stringify the user argument */
    chunksLen = chunks.length;
    if (chunksLen > scales.length) {
      return "";
    }

    /* Stringify each integer in each chunk */
    words = [];
    for (i = 0; i < chunksLen; i++) {
      chunk = parseInt(chunks[i]);

      if (chunk) {
        /* Split chunk into array of individual integers */
        ints = chunks[i].split("").reverse().map(parseFloat);

        /* If tens integer is 1, i.e. 10, then add 10 to units integer */
        if (ints[1] === 1) {
          ints[0] += 10;
        }

        /* Add scale word if chunk is not zero and array item exists */
        if ((word = scales[i])) {
          words.push(word);
        }

        /* Add unit word if array item exists */
        if ((word = units[ints[0]])) {
          words.push(word);
        }

        /* Add tens word if array item exists */
        if ((word = tens[ints[1]])) {
          words.push(word);
        }

        /* Add 'and' string after units or tens integer if: */
        if (ints[0] || ints[1]) {
          /* Chunk has a hundreds integer or chunk is the first of multiple chunks */
          if (ints[2] || (!i && chunksLen)) {
            words.push("and");
          }
        }

        /* Add hundreds word if array item exists */
        if ((word = units[ints[2]])) {
          words.push(word + " hundred");
        }
      }
    }

    return words.reverse().join(" ");
  };
  if (number.toString().split(".").length > 1) {
    return `${converter(number.toString().split(".")[0])} ruppes ${converter(
      number.toString().split(".")[1]
    )} paise only`;
  } else {
    return `${converter(number.toString().split(".")[0])} ruppes only`;
  }
};


const getIPInfo = async (ip: string) => {
  if (await ipInfo.getIPInfo.isIPv4(ip)) {
    return await ipInfo
      .getIPInfo(ip)
      .then((data: any) => {
        return data;
      })
      .catch((err: any) => {
        // throw err;
        return {
          lat: null,
          lon: null,
        };
      });
  } else {
    return {
      lat: null,
      lon: null,
    };
  }
};

const generateDocumentNumber=()=> {
  const date = new Date(); // Or any Date('YYYY-MM-DD')
  const unixTimestamp = Math.floor(date.getTime() / 1000);
  return unixTimestamp;
}

const createRequest = async (data: any) => {
  return Request.findOneAndUpdate(
    {
      userId: new mongoose.Types.ObjectId(data.soldBy),
      productId: new mongoose.Types.ObjectId(data._id),
      status: constants.requestStatus.pending,
    },
    {
      userId: new mongoose.Types.ObjectId(data.soldBy),
      productId: new mongoose.Types.ObjectId(data._id),
      status: constants.requestStatus.pending,
    },
    { new: true, upsert: true }
  ).then((request_detail) => {
    if (request_detail) {
      return true;
    }
  });
};




export {
  getMessage,
  unixTime,
  validateRequestData,
  randomNumber,
  createSlug,
  toLowerCase,
  minutes,
  getUsername,
  hashPassword,
  checkPassword,
  getPinDetail,
  generateAddressSlug,
  randomKey,
  randomiv,
  randomToken,
  jwtDecode,
  getFileName,
  fileUrl,
  photoUrl,
  imageUrl,
  removeFile,
  removePhoto,
  removeImage,
  createPassword,
  isDateValid,
  encryptMsg,
  decryptMsg,
  encryptObj,
  decryptObj,
  timeString,
  createBufferObject,
  hashMessage,
  objectToQS,
  removeLogo,
  phoneFormat,
  logoUrl,
  getIPInfo,
  generateSku,
  generateDocumentNumber,
  numberToWord,
  createRequest
};
