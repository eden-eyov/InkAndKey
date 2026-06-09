const Club = require('../models/club');

const createClub = async (req, res, next) => {
  try {
    const club = await Club.create({
      ...req.body,
      creator: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({
      success: true,
      data: club,
    });
  } catch (error) {
    next(error);
  }
};

const getAllClubs = async (req, res, next) => {
  try {
    const { search, genre, creator } = req.query;

    const filter = { isPublic: true };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (genre) {
      filter.genres = genre;
    }

    let clubs = await Club.find(filter)
      .populate('creator', 'username email profileImage')
      .populate('members', 'username profileImage')
      .sort({ createdAt: -1 });

    if (creator) {
      clubs = clubs.filter((club) =>
        club.creator?.username
          ?.toLowerCase()
          .includes(creator.toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      count: clubs.length,
      data: clubs,
    });
  } catch (error) {
    next(error);
  }
};

const getClubById = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('creator', 'name email profileImage')
      .populate('members', 'name profileImage');

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    res.status(200).json({
      success: true,
      data: club,
    });
  } catch (error) {
    next(error);
  }
};

const updateClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can update this club',
      });
    }

    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: updatedClub,
    });
  } catch (error) {
    next(error);
  }
};

const deleteClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club creator can delete this club',
      });
    }

    await Club.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Club deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const joinClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    const isAlreadyMember = club.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this club',
      });
    }

    club.members.push(req.user._id);
    await club.save();

    res.status(200).json({
      success: true,
      message: 'Joined club successfully',
      data: club,
    });
  } catch (error) {
    next(error);
  }
};

const leaveClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Club creator cannot leave their own club',
      });
    }

    const isMember = club.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this club',
      });
    }

    club.members = club.members.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );

    await club.save();

    res.status(200).json({
      success: true,
      message: 'Left club successfully',
      data: club,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClub,
  getAllClubs,
  getClubById,
  updateClub,
  deleteClub,
  joinClub,
  leaveClub,
};