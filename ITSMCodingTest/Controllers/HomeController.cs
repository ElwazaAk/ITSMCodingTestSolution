using System;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Collections.Generic;
using ITSMCodingTest.Helpers;
using ITSMCodingTest.Models;
using System.IO;
using Newtonsoft.Json;
using System.Linq;
using System.Data.Entity;
using System.Web;
using System.Drawing;

namespace ITSMCodingTest.Controllers
{
    public class HomeController : BaseController
    {
        public ActionResult Index()
        {
            return View();
        }

        /// <summary>
        /// Retrieves a list of countries from the countries.json helper.
        /// Original API from https://restcountries.eu/rest/v2/all
        /// Used for the Country selector
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public JsonResult GetCountries()
        {
            var rtn = new List<CountryView>();

            try
            {
                // Read the countries.json file within the Helpers folder and map to a list of CountryView, sorted alphabetically
                using (StreamReader r = new StreamReader(Server.MapPath("~/Helpers/countries.json")))
                {
                    string json = r.ReadToEnd();
                    rtn = JsonConvert.DeserializeObject<List<CountryView>>(json);
                }

                var result =
                   from e in rtn
                   orderby e.Name
                   select e;

                return SuccessResult(result);
            }
            catch (Exception e)
            {
                return FailedResult(e);
            }
        }

        /// <summary>
        /// Adds a new entry into the AddressRecords table using the AddressBookEntities database framework. Once the record is added, the generated Id of the record is returned back.
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public async Task<JsonResult> AddEntry()
        {
            try
            {
                // Add a new AddressRecord entry to the Entities
                using (var db = new AddressBookEntities())
                {
                    db.AddressRecords.Add(new AddressRecord
                    {
                        FirstName = "New",
                        LastName = "New"
                    });

                    await db.SaveChangesAsync();

                    var rtn = await db.AddressRecords.FirstOrDefaultAsync(p => p.LastName == "New" && p.FirstName == "New");

                    return SuccessResult(rtn.Id);
                }
            }
            catch (Exception e)
            {
                return FailedResult(e);
            }
        }

        /// <summary>
        /// Retrieves all of the AddressRecord records, sorted alphabetically by last name and then by first name.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetAllEntries()
        {
            try
            {
                // Retrieve all of the records
                using (var db = new AddressBookEntities())
                {
                    var rtn = await db.AddressRecords.OrderBy(p => p.LastName).ThenBy(x => x.FirstName).ToListAsync();

                    return SuccessResult(rtn);
                }
            }
            catch (Exception e)
            {
                return FailedResult(e);
            }
        }

        /// <summary>
        /// Retrieves the record data provided in the object's Id property and then updates all properties in the record that are editable.
        /// Remember, First and Last Name are required, and a photo may be provided. Check that the photo is a jpeg, gif, png, or bmp before allowing it to upload,
        /// and ensure the image is less than 1MB to allow upload. If all checks pass, save the image as a PNG to the Uploads folder.
        /// </summary>
        /// <param name="recordData"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<JsonResult> SaveEntry(AddressRecord recordData)
        {
            try
            {
                using (var db = new AddressBookEntities())
                {
                    // Try to retrieve the record, and fail if the record doesn't exist
                    var rtn = await db.AddressRecords.FirstOrDefaultAsync(p => p.Id == recordData.Id);

                    if (rtn == null)
                        throw new Exception("The address book entry does not exist.");

                    // Validate that the required fields have values
                    if (recordData.FirstName == null || recordData.LastName == null)
                        throw new Exception("Missing required fields from address book entry.");

                    var allowedExtensions = new[] {".jpg", ".jpeg", ".png", ".gif", ".bmp"};
                    for (var i = 0; i < Request.Files.Count; i++)
                    {
                        // Get the file if it exists, and if not, just carry on
                        // will not enter for-loop if photo does not exist
                        HttpPostedFileBase currentFile = Request.Files[i];

                        var image = Image.FromStream(currentFile.InputStream, true, true);

                        if (image == null) break;

                        // Check that the file has a valid name
                        if (currentFile.FileName == null) break;

                        // Validate the file size is less than 1MB
                        if (currentFile.ContentLength >= 1000000) break;

                        // Check that the photo is the correct type from the allowedExtensions
                        var extension = "." + currentFile.FileName.Split('.')[1];

                        if (!allowedExtensions.Contains(extension)) break;

                        // All is well, save the image to memory, and then drop it in the Uploads folder with the Id as the name in PNG format
                        using (MemoryStream m = new MemoryStream())
                        {
                            image.Save(m, image.RawFormat);
                        }

                        var name = recordData.Id + ".png";

                        var uploadDir = "~/Uploads";
                        var imagePath = Path.Combine(Server.MapPath(uploadDir), name);
                        var imageUrl = Path.Combine(uploadDir, name);
                        currentFile.SaveAs(imagePath);
                    }

                    // Update all record properties and save changes
                    rtn.FirstName = recordData.FirstName;
                    rtn.LastName = recordData.LastName;
                    rtn.Address = recordData.Address;
                    rtn.AddressLine2 = recordData.AddressLine2;
                    rtn.City = recordData.City;
                    rtn.ProvinceState = recordData.ProvinceState;
                    rtn.PostalZip = recordData.PostalZip;
                    rtn.Country = recordData.Country;
                    rtn.PhoneNumber = recordData.PhoneNumber;
                    rtn.EmailAddress = recordData.EmailAddress;

                    await db.SaveChangesAsync();

                    return SuccessResult();
                }
            }
            catch (Exception e)
            {
                return FailedResult(e);
            }
        }

        /// <summary>
        /// Deletes an entry from the Address Book
        /// </summary>
        /// <param name="recordId"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<JsonResult> DeleteEntry(int recordId)
        {
            try
            {
                // Get the record to delete, and fail if the record does not exist
                using (var db = new AddressBookEntities())
                {
                    var rtn = await db.AddressRecords.FirstOrDefaultAsync(p => p.Id == recordId);

                    if (rtn == null)
                        throw new Exception("The address book entry was not found. It may have already been deleted.");

                    db.AddressRecords.Remove(rtn);

                    await db.SaveChangesAsync();

                    return SuccessResult();
                }
            }
            catch (Exception e)
            {
                return FailedResult(e);
            }
        }
    }
}