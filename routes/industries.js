const express = require('express');
const db = require('../db');
const router = new express.Router();
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
    try {
        const industries = await db.query(
            `SELECT
                i.code,
                i.industry,
                c.code AS comp_code
            FROM industries AS i
            LEFT JOIN company_industry AS ci ON ci.ind_code = i.code
            LEFT JOIN companies AS c ON c.code = ci.comp_code
            `);
        let industryResult = [];
        for (row of industries.rows) {
            let resRow = industryResult.filter(x => x["code"] === row.code);
            if (resRow.length === 0) {
                index = industryResult.push({
                    code: row.code,
                    industry: row.industry,
                    companies: []
                });
                industryResult[index-1].companies.push(row.comp_code);
            } else {
                resRow[0].companies.push(row.comp_code);
            }
        }
        return res.json({industries: industryResult});
    } catch (e){
        return next(e);
    }
})

router.post('/', async (req, res, next) => {
    const { code, industry } = req.body;
    try {
        if (!code || !industry) {
            throw new ExpressError(`Bad Request; code and industry are required to create a new industry`, 400);
        }
        const result = await db.query(
            `INSERT INTO industries (code, industry)
            VALUES ($1, $2)
            RETURNING code, industry`,
            [code, industry]);
    
        return res.json(result.rows[0]);
    } catch (e) {
        return next(e);
    }
})

module.exports = router;