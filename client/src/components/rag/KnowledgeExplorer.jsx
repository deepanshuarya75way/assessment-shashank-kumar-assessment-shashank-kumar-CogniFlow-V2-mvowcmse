import React, {useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { Search, ChevronLeft, ChevronRight, Trash2} from "lucide-react";
import {getBackeendUrl} from "../../utils/apiConfig";
import {getAuthToken} from "../../utils/authStorage";
import SourceItem from "./SourceItem";
