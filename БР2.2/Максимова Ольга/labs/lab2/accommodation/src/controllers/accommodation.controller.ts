import { Request, Response } from "express";
import { accommodationService } from "../services";
import { CreateAccommodationDto, UpdateAccommodationDto } from "../dto";
import { publish, Topics, getUserIdFromToken } from "common";
import { IdParams, PhotoParams } from "../types/express";


function getUserIdOr401(req: Request, res: Response): string | null {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return userId;
}

async function getAccommodationOr404(id: string, res: Response) {
  const accommodation = await accommodationService.getById(id);
  if (!accommodation) {
    res.status(404).json({ message: "Accommodation not found" });
    return null;
  }
  return accommodation;
}

async function ensureOwner(req: Request<IdParams>, res: Response) {
  const userId = getUserIdOr401(req, res);
  if (!userId) return null;

  const accommodation = await getAccommodationOr404(req.params.id, res);
  if (!accommodation) return null;

  if (accommodation.landlord_id !== userId) {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }

  return { userId, accommodation };
}

class AccommodationController {
  getMyLandlord = async (req: Request, res: Response): Promise<void> => {
    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    const acc = await accommodationService.getMyLandlord(userId);
    res.status(200).json(acc);
  };

  getById = async (req: Request<IdParams>, res: Response): Promise<void> => {
    const acc = await accommodationService.getById(req.params.id);
    if (!acc) {
      res.status(404).json({ message: "Accommodation not found" });
      return;
    }
    res.status(200).json(acc);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const filters = {
      city: req.query.city as string | undefined,
      accomType: req.query.accom_type as string | undefined,
      roomsNum: req.query.rooms_num ? Number(req.query.rooms_num) : undefined,
      withKids:
        req.query.with_kids === "true"
          ? true
          : req.query.with_kids === "false"
            ? false
            : undefined,
      withPets:
        req.query.with_pets === "true"
          ? true
          : req.query.with_pets === "false"
            ? false
            : undefined,
      minPrice: req.query.min_price ? Number(req.query.min_price) : undefined,
      maxPrice: req.query.max_price ? Number(req.query.max_price) : undefined,
    };

    const accs = await accommodationService.search(filters);
    res.status(200).json(accs);
  };

  getAvailability = async (
    req: Request<IdParams>,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await accommodationService.checkAvailability(
        req.params.id,
        req.query.start as string,
        req.query.end as string,
      );

      if (!result) {
        res.status(404).json({ message: "Accommodation not found" });
        return;
      }

      res.status(200).json({
        available: result.available,
        ...(result.reason && { reason: result.reason }),
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const landlordId = getUserIdOr401(req, res);
    if (!landlordId) return;

    try {
      const users = await accommodationService.validateUsers([landlordId]);
      const user = users[0];

      if (!user) {
        res.status(404).json({ message: "Landlord not found" });
        return;
      }

      if (!user.is_verified) {
        res.status(403).json({ message: "Landlord is not verified" });
        return;
      }

      const dto = req.body as CreateAccommodationDto;
      const created = await accommodationService.create(dto, landlordId);

      await publish(Topics.Accommodation, {
        eventType: "accommodation.created",
        accommodationId: created.id,
        id: created.id,
        landlordId,
        title: created.title,
        address: created.address,
        rentTerms: created.rent_terms,
        facilityIds: created.facilities?.map((f: { id: any }) => f.id) ?? [],
      });

      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };


  createFacility = async (req: Request, res: Response): Promise<void> => {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    const userId = getUserIdOr401(req, res);
    if (!userId) return;

    try {
      const users = await accommodationService.validateUsers([userId]);
      const user = users[0];

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (!user.is_verified) {
        res.status(403).json({ message: "User is not verified" });
        return;
      }

      const facility = await accommodationService.createFacility(name);
      res.status(201).json(facility);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };

  patch = async (req: Request<IdParams>, res: Response): Promise<void> => {
    const guard = await ensureOwner(req, res);
    if (!guard) return;

    try {
      const dto = req.body as UpdateAccommodationDto;
      const updated = await accommodationService.updateById(req.params.id, dto);

      if (!updated) {
        res.status(404).json({ message: "Accommodation not found" });
        return;
      }

      res.status(200).json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  remove = async (req: Request<IdParams>, res: Response): Promise<void> => {
    const guard = await ensureOwner(req, res);
    if (!guard) return;

    const ok = await accommodationService.deleteById(req.params.id);
    if (!ok) {
      res.status(404).json({ message: "Accommodation not found" });
      return;
    }

    res.status(204).send();
  };

  addPhoto = async (req: Request<IdParams>, res: Response): Promise<void> => {
    const guard = await ensureOwner(req, res);
    if (!guard) return;

    const url = String(req.body?.url || "").trim();
    if (!url) {
      res.status(400).json({ message: "Photo url is required" });
      return;
    }

    const updated = await accommodationService.addPhoto(req.params.id, url);
    if (!updated) {
      res.status(404).json({ message: "Accommodation not found" });
      return;
    }

    res.status(200).json(updated);
  };

  deletePhoto = async (
    req: Request<PhotoParams>,
    res: Response,
  ): Promise<void> => {
    const guard = await ensureOwner(req as Request<IdParams>, res);
    if (!guard) return;

    const updated = await accommodationService.deletePhoto(
      req.params.id,
      req.params.photoId,
    );

    if (!updated) {
      res.status(404).json({ message: "Photo not found" });
      return;
    }

    res.status(200).json(updated);
  };

  getBatch = async (req: Request, res: Response): Promise<void> => {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    const accs = await accommodationService.batch(ids);
    res.status(200).json(accs);
  };

  getAvailabilityForService = async (
    req: Request<IdParams>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const start = req.query.start as string;
    const end = req.query.end as string;

    if (!start || !end) {
      res.status(400).json({ message: "Start and end dates are required" });
      return;
    }

    try {
      const result = await accommodationService.checkAvailability(
        id,
        start,
        end,
      );

      if (!result) {
        res.status(404).json({ message: "Accommodation not found" });
        return;
      }

      res.status(200).json({
        available: result.available,
        ...(result.reason && { reason: result.reason }),
        ...(result.landlordId && { landlordId: result.landlordId }),
        ...(result.totalAmount && { totalAmount: result.totalAmount }),
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  getAccommodationInternal = async (
    req: Request<IdParams>,
    res: Response,
  ): Promise<void> => {
    const acc = await accommodationService.getById(req.params.id);
    if (!acc) {
      res.status(404).json({ message: "Accommodation not found" });
      return;
    }

    res.status(200).json({
      accommodationId: acc.id,
      landlordId: acc.landlord_id,
      title: acc.title,
      address: acc.address,
      rent_terms: acc.rent_terms,
      facilities: acc.facilities,
      photos: acc.photos,
    });
  };
}

export default new AccommodationController();
