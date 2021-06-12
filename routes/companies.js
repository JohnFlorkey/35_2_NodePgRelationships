const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require("../expressError");
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT code, name FROM companies`);

        return res.json({companies: results.rows});
    } catch (e) {
        return next(e)
    }    
});

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const companyQry = db.query(`
            SELECT 
                code, 
                name 
            FROM companies 
            WHERE code = $1`, 
            [code]);
        const industriesQry = db.query(
            `SELECT 
                i.code, 
                i.industry
            FROM company_industry AS ci
            JOIN industries as i ON i.code = ci.ind_code
            WHERE ci.comp_code = $1`, 
            [code]);
        const invoicesQry = db.query(
            `SELECT id
            FROM invoices 
            WHERE comp_code = $1`,
            [code]);

        const companyResults = await companyQry;
        const industriesResults = await industriesQry;
        const invoicesResults = await invoicesQry;
    
        if (companyResults.rows.length === 0) {
            throw new ExpressError(`A companmy with code: ${code} could not be found.`, 404);
        }

        const company = companyResults.rows[0];
        const invoices = invoicesResults.rows.map(inv => inv.id);
        const industries = industriesResults.rows.map(ind => ind.industry);
        company["invoices"] = invoices;
        company["industries"] = industries;

        return res.json({company: company});
        // return res.json({company: {code: comp.code, name: comp.name, description: comp.description, invoices: invoices, industries}});
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const code = slugify(name, {lower: true});
        
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description] );

        return res.json({company: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query(
            `UPDATE companies 
            SET name = $1, 
                description = $2 
            WHERE code = $3 
            RETURNING code, name, description`, 
            [name, description, code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`A companmy with code: ${code} could not be found.`, 404);
        }
        return res.json({company: results.rows[0]});
    } catch(e) {
        return next(e);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const company = await db.query(`SELECT 1 FROM companies WHERE code = $1`, [code]);
        if (company.rows.length === 0) {
            throw new ExpressError(`A companmy with code: ${code} could not be found.`, 404);
        }
        await db.query(`DELETE FROM companies WHERE code = $1`, [code]);

        return res.json({status: 'deleted'});
    } catch(e) {
        return next(e);
    }
});

router.post('/:comp_code/industries/:ind_code', async (req, res, next) => {
    const { comp_code, ind_code } = req.params;
    try {
        const result = await db.query(
            `INSERT INTO company_industry
            VALUES ($1, $2)
            RETURNING comp_code, ind_code`,
            [comp_code, ind_code]);
        
        return res.redirect(`/companies/${comp_code}`);
    } catch (e) {
        return next(e);
    }
})


module.exports = router;