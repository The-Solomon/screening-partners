// Importing dependencies
import axios from "axios";
import xmljs from "xml2js";
import Sequelize from "sequelize";
import path from "path";
import fs from "fs";
import csv from 'csvtojson'
import { uuid } from "uuidv4";
import { Op } from "sequelize";
import { transliterate } from "transliteration";

// Importing models
import SanctionAddress from "../../models/SanctionAddress.model.js";
import SanctionAlias from "../../models/SanctionAlias.model.js";
import SanctionEntity from "../../models/SanctionEntity.model.js";
import SanctionInfo from "../../models/SanctionInfo.model.js";
import SanctionProgram from "../../models/SanctionProgram.model.js";
import SanctionDocument from "../../models/SanctionDocument.model.js";
import SanctionNationality from "../../models/SanctionNationality.model.js";
import PEP from "../../models/Pep.js";

// import OpenDataPeps from "../../../files/peps.js";
// Importing other services
import Parser from "./Parser.Service.js";


// Importing TS interfaces
import { 
    IArticle, 
    program, 
    alias, 
    IEUAliasData, 
    ethnic, 
    detail, 
    address, 
    document, 
    ISanction, 
    ISanctionParsingResult, 
    INewsParsingResult,
    ISelectSanctionsRequest,
    ISelectSanctionsResponse,
} from "../../loaders/Interfaces.js"


/**
 * Creating sequelize operator aliases. It basicly means that now we can use
 * $or instead of Op.or and $like instead of  Op.like, etc.
 */
//  const operatorsAliases = {
//     $eq: Op.eq,
//     $or: Op.or,
//     $like: Op.like,
// };


export default class SanctionService {
    public parseBISData(): Promise < any > {
        return new Promise((resolve, reject) => {
            (async ()=> {
                const filePath='/static/xml/BIS.csv'
                await csv()
                .fromFile(path.join(path.resolve(), filePath))
                .then((jsonObj)=>{
                    const results: any = {};
                    results.entries = jsonObj.map((entry, i) => {
                        let authority, firstName, lastName, sdnType, addressList, programList, akaList, idList, dateOfBirthList, placeOfBirthList, pubDate;
                        const postalCodeVar = "Postal Code",
                            entityNumberVar = "Entity Number",
                            sdnTypeVar = "SDN Type",
                            stateOrProvinceVar = "State/Province",
                            federalRegisterNoticeVar = "Federal Register Notice",
                            effectiveDateVar = "Effective Date",
                            licenceRequirementVar = "License Requirement",
                            pubDateVar = "Effective Date",
                            licencePolicyVar = "License Policy",
                            remarksVar = "Remarks/Notes",
                            alernativeNamesVar = "Alternate Name";
                        
                        lastName = entry.Name.slice(0, 254);
                        programList = {};
                        authority = 'BIS';
                        sdnType = 'Individual';
                        pubDate = Date.parse(entry[pubDateVar]) || Date.now()
                        programList = {
                            program: ["-"]
                        };
                        // akalist.aka entity alwait have a lastname
                        akaList = {};
                        idList = {
                            id: []
                        };
                        addressList = {};
                        dateOfBirthList = {};
                        placeOfBirthList = {};
                        
                        if(entry[alernativeNamesVar].length){
                            akaList.aka = [];
                            let names =  entry[alernativeNamesVar].split(',');
                            names = names.reduce((acc, name) => {
                                if(name.length) acc.push({lastName: name})
                                return acc
                            }, [])
                            akaList.aka.push(...names)
                        }

                        if(
                            entry.Address ||
                            entry.City ||
                            entry.Country ||
                            entry.Address ||
                            entry[postalCodeVar] ||
                            entry[stateOrProvinceVar]
                        ) {
                            addressList.address = []
                            const location: any  = {}
                            if(entry.Address) location.address1 = entry.Address.split(';')[0];
                            if(entry.City) location.city = entry.City;
                            if(entry.Country) location.country = entry.Country;
                            if(entry[postalCodeVar]) location.postalCode = entry[postalCodeVar];
                            if(entry[stateOrProvinceVar]) location.stateOrProvince = entry[stateOrProvinceVar];
                           
                           
                            addressList.address.push(location)
                        }
                        
                        if(entry[federalRegisterNoticeVar]){
                            idList.id.push({
                                idType: federalRegisterNoticeVar,
                                idNumber: entry[federalRegisterNoticeVar]
                            })
                        }
                        if(entry[licenceRequirementVar]){
                            idList.id.push({
                                idType: licenceRequirementVar,
                                idNumber: entry[licenceRequirementVar]
                            })
                        }
                        if(entry[licencePolicyVar]){
                            idList.id.push({
                                idType: licencePolicyVar,
                                idNumber: entry[licencePolicyVar]
                            })
                        }
                        if(entry[remarksVar]){
                            idList.id.push({
                                idType: remarksVar,
                                idNumber: entry[remarksVar]
                            })
                        }
                        
                        return {
                            authority,
                            firstName,
                            lastName,
                            sdnType,
                            addressList,
                            programList,
                            akaList,
                            idList,
                            dateOfBirthList,
                            placeOfBirthList,
                            pubDate
                        }
                    });
                    resolve(results)
                })
            })();
        })
    }
    // public async INSERT_PEPS(): Promise<any> {
    //     const entries = OpenDataPeps;
    //     console.log('Importing JSON...')
    //     for(let i = 0; i < entries.length; i++){
    //         const sqlData = {} as any;
    //         const p = entries[i];
    //         sqlData.fullName = p.caption || '';
    //         sqlData.type = p.schema || 'person';
    //         if(p.properties.firstName) sqlData.firstName = p.properties.firstName.join(' ');
    //         if(p.properties.lastName) sqlData.lastName = p.properties.lastName.join(' ');
    //         if(p.properties.fatherName) sqlData.fatherName = p.properties.fatherName.join(' ');
    //         if(p.properties.nationality) sqlData.nationality = p.properties.nationality.join(', ');
    //         if(p.properties.country) sqlData.country = p.properties.country.join(', ');
    //         if(p.properties.birthDate) sqlData.birthDate = p.properties.birthDate.join(', ');

    //         if(p.properties.birthPlace) sqlData.birthPlace = p.properties.birthPlace.join(', ');
    //         if(p.properties.deathDate) sqlData.deathDate = p.properties.deathDate.join(', ');
    //         if(p.properties.status) sqlData.status = p.properties.status.join(', ');
    //         if(p.properties.gender) sqlData.gender = p.properties.gender.join(', ');
    //         if(p.properties.position) sqlData.position = p.properties.position.join(', ');

    //         if(p.properties.innCode) sqlData.innCode = p.properties.innCode.join(', ');
    //         if(p.properties.religion) sqlData.religion = p.properties.religion.join(', ');
    //         if(p.properties.modifiedAt) sqlData.modifiedAt = p.properties.modifiedAt.join(', ');
    //         // if(p.properties.createdAt) sqlData.createdAt = p.properties.createdAt.join(', ');
    //         if(p.properties.name) sqlData.nameVariations = p.properties.name.join(', ');
    //         if(p.properties.sourceUrl) sqlData.sourceUrl = p.properties.sourceUrl.join(', ');
    //         if(p.properties.education) sqlData.education = p.properties.education.join(', ');
    //         if(p.properties.notes) sqlData.notes = p.properties.notes.join(', ');
    //         if(p.properties.website) sqlData.website = p.properties.website.join(', ');
    //         if(p.properties.ethnicity) sqlData.ethnicity = p.properties.ethnicity.join(', ');
    //         if(p.properties.weakAlias) sqlData.weakAlias = p.properties.weakAlias.join(', ');


    //         await PEP.create(sqlData)
    //     }
    //     console.log('All peps are loaded');
    // }
    public async INSERT_SANCTIONS(): Promise<any> {
        const parser = new Parser();
        
        const OFAC = await parser.getOFACData();
        const UK = await parser.getUKData();
        const UN = await parser.getUNData();
        const EU = await parser.getEUData();
        const BIS = await parser.getBISData();

        const entries = [
            ...OFAC.entries,
            ...UK.entries,
            ...UN.entries,
            ...EU.entries,
            ...BIS.entries
        ];

        return Promise.all(entries.map(async (sanction: ISanction) => {
            const {
                id,
                pubDate,
                firstName,
                lastName,
                fullName,
                authority,
                type,
                remarks,
                programs,
                aliases,
                addresses,
                details,
                documents,
                nationality,
                website,
                list
            } = sanction;
            
            return await SanctionEntity.create({
                fullName: fullName.toUpperCase(),
                id, pubDate, firstName, lastName, authority, type, remarks, website, list
            }).then((entity) => {
                if(programs.length){
                    const sql = programs.map((prog) => {
                        const dbItem: any = {};
                        dbItem.name = prog;
                        dbItem.sanction = id;
                        return dbItem;
                    })
                    return SanctionProgram.bulkCreate(sql);
                }
            }).then((programs) => {
                if(addresses.length){
                    addresses.forEach((location) => location.sanction = id);
                    return SanctionAddress.bulkCreate(addresses);
                }
            }).then((addresses) => {
                if(aliases.length){
                    aliases.forEach((alternative) => alternative.sanction = id);
                    return SanctionAlias.bulkCreate(aliases);
                }
            }).then((aliases) => {
                if(details.length){
                    details.forEach((info) => info.sanction = id);
                    return SanctionInfo.bulkCreate(details);
                }
            }).then((details) => {
                if(documents.length){
                    documents.forEach((doc) => doc.sanction = id);
                    return SanctionDocument.bulkCreate(documents);
                }
            }).then((document) => {
                if(nationality.length){
                    nationality.forEach((ethnic) => ethnic.sanction = id);
                    return SanctionNationality.bulkCreate(nationality);
                }
            }).catch((err) => {
                throw new Error(err)
            })
        }));
    }
    public async SELECT_PEPS(query: any): Promise<any> {
        const entries = await PEP.findAll({
            limit: query.limit,
            offset: ((query.offset - 1) * query.limit),
            where: {
                fullName: {
                    [Op.iLike]: `%${query.target}%`
                }
            },
        })
        const count = await PEP.count({
            where: {
                fullName: {
                    [Op.iLike]: `%${query.target}%`
                }
            }
        });
        return {
            entries, count
        }
    }
    public async SELECT_SANCTIONS(query: ISelectSanctionsRequest): Promise < any > {
        return new Promise((resolve, reject) => {
            const target = query.target.toUpperCase();
            SanctionEntity.findAll({
                limit: query.limit,
                offset: ((query.offset - 1) * query.limit),
                where: {
                    fullName: {
                        [Op.iLike]: `%${target}%`
                    }
                },
                include: [SanctionProgram, SanctionAddress, SanctionInfo, SanctionAlias, SanctionDocument, SanctionNationality]
            }).then(async (data) => {
                const count = await SanctionEntity.count({
                    where: {
                        fullName: {
                            [Op.iLike]: `%${target}%`
                        }
                    }
                });
                const response: ISelectSanctionsResponse = {
                    entries: data,
                    count: count
                };
                resolve(response)
            }).catch((err) => {
                reject(err)
            })
        })
    };
    public async updateSanctions(): Promise < any > {
        console.log('Deleting Addresses table');
		await SanctionAddress.destroy({
            where: {}
        }).then((data) => {
            console.log('Deleting aliases table');
            return SanctionAlias.destroy({
                where: {}
            })
        }).then((data) => {
            console.log('Deleting programs table');
            return SanctionProgram.destroy({
                where: {}
            })
        }).then((data) => {
            console.log('Deleting Infos table');
            return SanctionInfo.destroy({
                where: {}
            })
        }).then((data) => {
            console.log('Deleting documents table');
            return SanctionDocument.destroy({
                where: {}
            })
        }).then((data) => {
            console.log('Deleting documents table');
            return SanctionNationality.destroy({
                where: {}
            })
        }).then((data) => {
            console.log('Deleting Entities table');
            return SanctionEntity.destroy({
                where: {}
            })
        }).then((data) => {
            console.log('Filling database with new data');
            return this.INSERT_SANCTIONS()
        }).catch((err) => {
            console.log(err);
            console.log('An error occured while cleaning the database')
        })
    }
}