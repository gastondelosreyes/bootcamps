const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');

// @author  Gastón De los Reyes
// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler(async(req, res, next) => {
    //Filtering by average cost
    let query;
    //Copy req.query on a variable
    let reqQuery = {...req.query };

    //Fields excluded
    let removeFields = ['select', 'sort', 'page', 'limit'];

    //Search over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    //Create query string
    let queryString = JSON.stringify(reqQuery);

    //Create operators ($gt,$gte,$lt,$lte,$in)
    queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    //Finding resource
    query = Bootcamp.find(JSON.parse(queryString));

    //Select fields
    if (req.query.select) {
        //Mongoose select fields needs " " instead of "," but you cant use " " on url query
        //Split the , in the query and join them with " "
        let fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    //Sort the query
    if (req.query.sort) {
        let sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        //If sort is not specified, then sort by date
        query = query.sort('-createdAt');
    }

    //Pagination: Default 1 or specified by url query
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 2;

    //Calculate to skip the other
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;
    let total = await Bootcamp.countDocuments();

    query = query.skip(startIndex).limit(limit);

    const bootcamps = await query;

    //Pagination result
    let pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    //Normal way -> const bootcamps = await Bootcamp.find();
    res.status(200).json({
        success: true,
        count: bootcamps.length,
        pagination,
        data: bootcamps
    });
});

// @author  Gastón De los Reyes
// @desc    Get single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
        success: true,
        data: bootcamp
    });
});

// @author  Gastón De los Reyes
// @desc    Create a new bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
exports.createBootcamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.create(req.body);
    res.status(201).json({
        success: true,
        data: bootcamp
    });
});

// @author  Gastón De los Reyes
// @desc    Update a bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: bootcamp
    });
});

// @author  Gastón De los Reyes
// @desc    Delete bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
        success: true,
        message: "Object deleted"
    });
});

// @author  Gastón De los Reyes
// @desc    Get bootcamps within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Private
exports.getBootcampsInRadius = asyncHandler(async(req, res, next) => {
    const { zipcode, distance } = req.params;

    // Get latitude and longitude from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    //Calculate radius using radians
    //Divide distance by radius of the Earth
    //Earth radius = 3,963 mi / 6,378 km
    let earth = 6378
    const radius = distance / earth
    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ]
            }
        }
    });
    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })
});