import { Request, Response } from "express";
import { rentService } from "../services";
import { getUserIdFromToken } from "common";
import { CreateRentDto } from "../dto/rent.dto";
import { IdParams, BatchQuery, InternalAccomQuery } from "../types/express";

const mapErrorToStatus = (message: string): number => {
  if (message === "ACCOMMODATION_NOT_AVAILABLE") return 409;
  return 400;
};

class RentController {
  getAll = async (req: Request, res: Response): Promise<void> => {
    const rents = await rentService.getAll();
    res.status(200).json(rents);
  };

  getMyTenant = async (req: Request, res: Response): Promise<void> => {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const data = await rentService.getMyTenantWithAccommodations(userId);
    res.status(200).json(data);
  };

  getBatch = async (
    req: Request<{}, {}, {}, BatchQuery>,
    res: Response,
  ): Promise<void> => {
    const ids = String(req.query.ids ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length) {
      res.status(400).json({ error: "ids query required" });
      return;
    }

    res.json(await rentService.getByIds(ids));
  };

  getById = async (req: Request<IdParams>, res: Response): Promise<void> => {
    const rent = await rentService.getById(req.params.id);
    if (!rent) {
      res.status(404).json({ error: "Rent not found" });
      return;
    }

    res.json(rent);
  };

  getByAccommodation = async (
    req: Request<{ accommodationId: string }, {}, {}, { status?: string }>,
    res: Response,
  ): Promise<void> => {
    const { accommodationId } = req.params;
    const status = req.query.status as string | undefined;

    const rents = await rentService.getByAccommodation(accommodationId, status);
    res.status(200).json(rents);
  };

  getActiveByAccommodation = async (
    req: Request<{ accommodationId: string }>,
    res: Response,
  ): Promise<void> => {
    const { accommodationId } = req.params;

    const rents = await rentService.getActiveByAccommodation(accommodationId);
    res.status(200).json(rents);
  };

  getAccommodationInternal = async (
    req: Request<{}, {}, {}, InternalAccomQuery>,
    res: Response,
  ): Promise<void> => {
    const ids = String(req.query.ids ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length) {
      res.status(400).json({ error: "ids query required" });
      return;
    }

    const accommodations = await rentService.getAccommodationData(ids);
    res.status(200).json(accommodations);
  };

  create = async (
    req: Request<{}, {}, CreateRentDto>,
    res: Response,
  ): Promise<void> => {
    const tenantId = getUserIdFromToken(req);
    if (!tenantId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const users = await rentService.validateUsers([tenantId]);
      const user = users[0];

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (!user.is_verified) {
        res.status(403).json({ message: "User is not verified" });
        return;
      }

      const { accommodationId, startDate, endDate } = req.body;

      if (!accommodationId || !startDate || !endDate) {
        res.status(400).json({ message: "Missing required fields" });
        return;
      }

      const result = await rentService.requestRent({
        tenantId,
        accommodationId,
        startDate,
        endDate,
      });

      if ("error" in result) {
        res
          .status(mapErrorToStatus(result.error))
          .json({ message: result.error });
        return;
      }

      res.status(201).json({
        message: "Rent request accepted",
        rentId: result.rent.id,
        status: result.rent.status,
      });
    } catch (err: any) {
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export default new RentController();
