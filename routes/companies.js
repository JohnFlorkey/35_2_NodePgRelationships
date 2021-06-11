const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require("../expressError");
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);

        return res.json({companies: results.rows});
    } catch (e) {
        return next(e)
    }    
});

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`SELECT * FROM companies WHERE code = $1`, [code]);
    
        if (results.rows.length === 0) {
            throw new ExpressError(`A companmy with code: ${code} could not be found.`, 404);
        }

        const invoices = await db.query(`SELECT * FROM invoices WHERE comp_code = $1`, [code]);

        const comp = results.rows[0];

        return res.json({company: {code: comp.code, name: comp.name, description: comp.description, invoices: invoices.rows}});
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        let { code, name, description } = req.body;
        code = slugify(code);
        
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
        const results = await db.query(`UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING code, name, description`, [name, description, code] );
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

module.exports = router;