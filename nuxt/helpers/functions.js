import moment from "moment"
export default {
    getFormattedDateString: (date, formatType) => moment(date).format(formatType),
    refactorPepsFetchedData: (data) => {
        return data.map((pep, i) => {
            const res = {};
            res.fullName = pep.caption;
            res.firstName = pep.properties.firstName;
            res.lastName = pep.properties.lastName;
            res.fatherName = pep.properties.fatherName;
            res.secondName = pep.properties.secondName;
            res.id = pep.id;
            res.type = pep.schema;
            res.nationality = pep.properties.nationality;
            res.country = pep.properties.country;
            res.birthDate = pep.properties.birthDate;
            res.birthPlace = pep.properties.birthPlace;
            res.deathDate = pep.properties.deathDate
            res.status = pep.properties.status;
            res.gender = pep.properties.gender;
            res.position = pep.properties.position;
            res.innCode = pep.properties.innCode;
            res.religion = pep.properties.religion;
            res.modifiedAt = pep.properties.modifiedAt;
            res.createdAt = pep.properties.createdAt;


            res.nameVariations = pep.properties.name;
            res.aliases = pep.properties.alias;
            res.sourceUrl = pep.properties.sourceUrl;
            res.education = pep.properties.education;
            res.notes = pep.properties.notes;
            res.website = pep.properties.website;
            res.ethnicity = pep.properties.ethnicity
            res.weakAlias = pep.properties.weakAlias
            return res;
        })
    },
    refactorNewsFetchedData: (data) => {
        return data.map((article, i) => {
            const refactored = {}
            refactored.id = `n-${i}-${Date.now()}`;
            refactored.source = article.source;
            refactored.url = article.url;
            refactored.body = article.body;
            refactored.title = article.title;
            refactored.date = article.date;
            refactored.details = article.article
            return refactored;
        })
    },
    scrollToTarget: (selector) => {
        const $el = document.querySelector(selector);
        const elementY = $el.getBoundingClientRect().top
        document.body.scroll({
            top: elementY,
            behavior: "smooth"
        })
    },
    isValidTarget: (str) => {
        str = str.replace(/\W+/, '')

        if(
            str.length > 3 &&
            str.length < 50
        ) { return true };

        return false;
    },
    createUrlQueryParam: (str) => str.split(/\s+/gi).join('+'),
}