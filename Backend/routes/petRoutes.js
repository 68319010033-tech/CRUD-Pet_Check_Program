const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');

// @desc    Get all pets (READ)
// @route   GET /api/pets
router.get('/', async (req, res) => {
  try {
    const pets = await Pet.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(pets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get a single pet (READ)
// @route   GET /api/pets/:id
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    res.status(200).json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a new pet (CREATE)
// @route   POST /api/pets
router.post('/', async (req, res) => {
  try {
    const newPet = await Pet.create(req.body);
    res.status(201).json(newPet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a pet's details (UPDATE)
// @route   PUT /api/pets/:id
router.put('/:id', async (req, res) => {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });

    await pet.update(req.body);
    res.status(200).json(pet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a pet (DELETE)
// @route   DELETE /api/pets/:id
router.delete('/:id', async (req, res) => {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });

    await pet.destroy();
    res.status(200).json({ message: 'Pet removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;